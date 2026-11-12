// Ensaio somente no projeto novo reservado por prepare-infra-check.ps1.
const { execFileSync } = require('node:child_process');
const https = require('node:https');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.resolve(__dirname, '../Projeto-back-end/package.json'));
const jwt = backendRequire('jsonwebtoken');
process.chdir(path.resolve(__dirname, '..'));
const [project, envFile, output] = process.argv.slice(2);
assert.match(project || '', /^cinemax-rubrica-[a-f0-9]{12}$/, 'Informe o projeto novo retornado pelo preparador');
assert.equal(envFile, `.audit-tmp/infra/${project}/environment.env`);
assert.equal(output, `docs/evidencias/complementacao/infra-${project}.json`);
assert.ok(!fs.existsSync(output), 'Evidencia existente: prepare outro ambiente; nao sobrescreva resultados');
const args = ['compose', '--env-file', envFile, '-p', project, '-f', 'docker-compose.yml', '-f', 'docker-compose.rubrica.yml'];
const docker = (...command) => execFileSync('docker', [...args, ...command], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const redis = (...command) => docker('exec', '-T', 'redis', 'redis-cli', '--raw', ...command);
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
assert.equal(env.ENV_FILE, './' + envFile);
assert.equal(env.CINEMAX_INFRA_PROJECT, project);
assert.ok(Number(env.CACHE_TTL_SECONDS) >= 30 && Number(env.CACHE_TTL_SECONDS) <= 120, 'Configure TTL entre 30 e 120 segundos para tolerar a latencia do Docker CLI');
const databaseContainer = docker('ps', '-q', 'database');
assert.ok(databaseContainer, 'Banco isolado nao iniciado');
const databaseInfo = JSON.parse(execFileSync('docker', ['inspect', databaseContainer], { encoding: 'utf8' }))[0];
assert.equal(databaseInfo.Config.Labels['com.docker.compose.project'], project);
assert.equal(databaseInfo.Mounts.find(mount => mount.Destination === '/var/lib/mysql')?.Name, `${project}_mysql-data`);
// Token administrativo de curta duração, apenas neste ambiente isolado, sem alterar usuários.
const token = jwt.sign({ id_usuario: 1, email: 'infra-check@example.test', tipo_usuario: 'admin' }, env.JWT_SECRET, { expiresIn: '10m' });
const ca = fs.readFileSync(process.env.CINEMAX_CA_FILE || `${env.TLS_CERTS_DIR}/cinema.local.crt`);
function request(route, method = 'GET', body, secure = true, authenticated = true, requestId) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = (secure ? https : http).request({ hostname: '127.0.0.1', port: secure ? 18443 : 18080, servername: 'cinema.local', ca, path: route,
      method, headers: { Host: 'cinema.local', ...(authenticated ? { Authorization: `Bearer ${token}` } : {}), ...(requestId ? { 'X-Request-Id': requestId } : {}), ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}) } }, res => {
      let text = ''; res.setEncoding('utf8'); res.on('data', part => { text += part; });
      res.on('end', () => { let data; try { data = JSON.parse(text); } catch { data = text; } resolve({ status: res.statusCode, headers: res.headers, data }); });
    });
    req.setTimeout(10000, () => req.destroy(new Error('HTTP timeout')));
    req.on('error', reject); req.end(payload);
  });
}
async function api(route, method = 'GET', body, status = 200) {
  const response = await request('/api' + route, method, body);
  assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(response.data)}`);
  return response.data;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { try { if (await check()) return; } catch {} await delay(250); }
  throw new Error('Condição de integração não satisfeita em ' + timeout + ' ms');
}
function logs() {
  return docker('logs', '--no-color', 'backend').split('\n').flatMap(line => { try { const data = JSON.parse(line.slice(line.indexOf('{'))); return data.component === 'redis_pubsub' ? [data] : []; } catch { return []; } });
}
const version = collection => redis('GET', `cinemax:catalogo:${collection}:version`) || '0';
const key = (collection, variant) => `cinemax:catalogo:${collection}:${version(collection)}:${variant}`;
const sets = () => Number(/cmdstat_set:calls=(\d+)/.exec(redis('INFO', 'commandstats'))?.[1] ?? 0);
const checks = [];
function record(check, evidence) { checks.push({ check, evidence }); console.log(JSON.stringify({ check, evidence })); }

(async () => {
  let redisStopped = false;
  let movie, session, room;
  try {
    const redirect = await request('/catalogo', 'GET', undefined, false);
    assert.equal(redirect.status, 301); assert.equal(redirect.headers.location, 'https://cinema.local:18443/catalogo');
    const home = await request('/'); assert.equal(home.status, 200); assert.match(home.data, /<html/i);
    assert.match(home.headers['strict-transport-security'], /max-age=/);
    assert.match(home.headers['content-security-policy'], /object-src 'none'/);
    assert.equal((await request('/login')).status, 200);
    const asset = /src="([^"]+\.js)"/.exec(home.data)?.[1];
    assert.ok(asset); assert.equal((await request(asset)).status, 200);
    assert.equal((await request('/posters/infra-not-found.webp')).status, 404);
    record('nginx_tls_frontend', { redirect: 301, https: 200, spa: 200, tlsVerified: true, securityHeaders: true });
    assert.equal((await request('/api/metrics', 'GET', undefined, true, false)).status, 401);
    const metricsBefore = await api('/metrics');
    const correlationId = randomUUID();
    const correlated = await request('/api/catalogo/filmes?page=1&limit=1', 'GET', undefined, true, true, correlationId);
    assert.equal(correlated.status, 200);
    assert.equal(correlated.headers['x-request-id'], correlationId);
    const metricsAfter = await api('/metrics');
    assert.equal(metricsAfter.startedAt, metricsBefore.startedAt);
    assert.ok(metricsAfter.business.completedRequests > metricsBefore.business.completedRequests);
    await until(() => docker('logs', '--no-color', 'backend').includes(correlationId));
    record('observability_real', { metricsWithoutToken: 401, metricsWithAdmin: 200, correlationId, businessRequestDelta: metricsAfter.business.completedRequests - metricsBefore.business.completedRequests, sameProcess: true, metrics: metricsAfter });
    assert.equal(redis('PING'), 'PONG');
    await until(() => logs().some(e => e.action === 'subscribed'));
    movie = await api('/filmes', 'POST', { titulo: 'Infra Redis ' + Date.now() }, 201);
    const movieId = movie.id_filme;
    const moviePath = '/catalogo/filmes/' + movieId;
    let cacheKey = key('filmes', 'id:' + movieId);
    assert.equal(redis('GET', cacheKey), '');
    const before = sets();
    assert.equal((await api(moviePath)).id_filme, movieId);
    assert.equal(sets(), before + 1);
    // Valor e prazo na mesma observacao: evita expirar entre dois processos Docker CLI.
    const snapshot = JSON.parse(redis('EVAL', "return cjson.encode({value=redis.call('GET',KEYS[1]),pttl=redis.call('PTTL',KEYS[1])})", '1', cacheKey));
    assert.ok(snapshot.value, 'Cache deve existir apos o miss');
    const stored = JSON.parse(snapshot.value); assert.equal(stored.id_filme, movieId);
    const ttl = Number(snapshot.pttl); assert.ok(ttl > 0 && ttl <= Number(env.CACHE_TTL_SECONDS) * 1000, `TTL observado=${ttl}ms; configurado=${env.CACHE_TTL_SECONDS}s`);
    const afterMiss = sets();
    console.log(JSON.stringify({ diagnostic: 'before_hit', at: Date.now(), ttl, cacheKey }));
    await api(moviePath);
    const afterHit = sets();
    console.log(JSON.stringify({ diagnostic: 'after_hit', at: Date.now(), afterMiss, afterHit, currentVersion: version('filmes'), pttl: redis('PTTL', cacheKey) }));
    assert.equal(afterHit, afterMiss);
    record('cache_miss_hit', { id: movieId, key: cacheKey, missSetDelta: 1, hitSetDelta: 0, pttl: ttl });
    await delay(ttl + 100);
    assert.equal(redis('GET', cacheKey), '');
    await api(moviePath); assert.equal(sets(), afterMiss + 1);
    record('cache_ttl', { expired: true, nextReadRepopulated: true });
    const oldVersion = version('filmes');
    await api('/filmes/' + movieId, 'PUT', { titulo: 'Infra atualizado' });
    assert.notEqual(version('filmes'), oldVersion);
    cacheKey = key('filmes', 'id:' + movieId); assert.equal(redis('GET', cacheKey), '');
    assert.equal((await api(moviePath)).titulo, 'Infra atualizado');
    const persistedTitle = docker('exec', '-T', 'backend', 'node', '-e', "const Filme=require('./dist/models/Filme').default; Filme.findByPk(Number(process.argv[1]),{logging:false}).then(row=>{process.stdout.write(row.titulo);return Filme.sequelize.close();}).catch(()=>process.exit(1));", String(movieId));
    assert.equal(persistedTitle, 'Infra atualizado');
    assert.ok((await api('/catalogo/filmes')).some(row => row.id_filme === movieId));
    await api('/catalogo/filmes?page=1&limit=10');
    assert.ok(redis('GET', key('filmes', 'page:1:limit:10')));
    record('cache_invalidation', { versionChanged: true, updatedTitle: 'Infra atualizado', mysqlPersistedTitle: persistedTitle, paginatedListCached: true });



    room = await api('/salas', 'POST', { nome: 'Infra Redis ' + Date.now() }, 201);
    session = await api('/sessoes', 'POST', { id_filme: movieId, id_sala: room.id_sala, preco: 20, horario: '2099-01-01T20:00:00Z' }, 201);
    const sessionId = session.id_sessao;
    await api('/catalogo/sessoes/' + sessionId);
    const sessionCacheKey = key('sessoes', 'id:' + sessionId);
    assert.ok(redis('GET', sessionCacheKey), `Cache de sessao ausente: ${sessionCacheKey}; TTL=${redis('PTTL', sessionCacheKey)}`);
    const sessionVersion = version('sessoes');
    await api('/sessoes/' + sessionId, 'PUT', { preco: 25 });
    assert.notEqual(version('sessoes'), sessionVersion);
    assert.equal(Number((await api('/catalogo/sessoes/' + sessionId)).preco), 25);
    assert.ok((await api('/catalogo/sessoes')).some(row => row.id_sessao === sessionId));
    await api('/sessoes/' + sessionId, 'DELETE');
    await api('/catalogo/sessoes/' + sessionId, 'GET', undefined, 404);
    assert.equal(redis('GET', key('sessoes', 'id:' + sessionId)), '');
    const readyBefore = logs().filter(e => e.action === 'connection_ready' && e.connection === 'publisher').length;
    docker('stop', 'redis'); redisStopped = true;
    await api('/filmes/' + movieId, 'PUT', { titulo: 'Infra fallback' });
    assert.equal((await api(moviePath)).titulo, 'Infra fallback');
    const outageLogs = docker('logs', '--no-color', 'backend');
    assert.match(outageLogs, /\[cache Redis\]/); assert.match(outageLogs, /publish_unavailable|publish_failed/);
    record('redis_fallback', { update: 200, read: 200, title: 'Infra fallback', cacheAndPubsubWarnings: true });
    docker('start', 'redis'); redisStopped = false;
    await until(() => redis('PING') === 'PONG' && logs().filter(e => e.action === 'connection_ready' && e.connection === 'publisher').length > readyBefore);
    await until(() => {
      const numbers = redis('PUBSUB', 'NUMSUB', 'cinemax:eventos:filmes', 'cinemax:eventos:sessoes').split(/\r?\n/);
      return Number(numbers[1]) >= 1 && Number(numbers[3]) >= 1;
    });
    // O cache tem seu próprio intervalo de reconexão de 5 s, independente do Pub/Sub.
    await delay(5500);
    await api('/filmes/' + movieId, 'PUT', { titulo: 'Infra recuperado' });
    // A invalidacao falhada ativa bypass local por um TTL; reconexao nao o encerra antes.
    await until(async () => {
      assert.equal((await api(moviePath)).titulo, 'Infra recuperado');
      return !!redis('GET', key('filmes', 'id:' + movieId));
    }, Number(env.CACHE_TTL_SECONDS) * 1000 + 15000);
    record('redis_recovery', { ping: 'PONG', cacheRepopulated: true, subscriptionsRestored: true, ttlBypassRespected: true });
    await api('/filmes/' + movieId, 'DELETE');
    await api(moviePath, 'GET', undefined, 404);
    assert.equal(redis('GET', key('filmes', 'id:' + movieId)), '');
    assert.ok(!(await api('/catalogo/filmes')).some(row => row.id_filme === movieId));
    assert.ok(!(await api('/catalogo/sessoes')).some(row => row.id_sessao === sessionId));
    await api('/salas/' + room.id_sala, 'DELETE');
    record('crud_filmes_sessoes', { movieId, sessionId, created: 201, updated: 200, deleted: 200, deletedDetails: 404, errorsNotCached: true });

    const expected = ['filme.created', 'filme.updated', 'filme.deleted', 'sessao.created', 'sessao.updated', 'sessao.deleted'];
    await until(() => expected.every(type => logs().some(e => e.action === 'consumed' && e.type === type && e.id === (type.startsWith('filme.') ? movieId : sessionId))));
    const circulation = logs().filter(e => ['published', 'consumed'].includes(e.action) && e.id === (e.type?.startsWith('filme.') ? movieId : sessionId));
    for (const type of expected) {
      const published = circulation.find(e => e.action === 'published' && e.type === type);
      assert.ok(published && circulation.some(e => e.action === 'consumed' && e.eventId === published.eventId));
    }
    record('pubsub_real', { types: expected, matchedPublicationAndConsumption: true });
    docker('exec', '-T', 'nginx', 'nginx', '-t');
    await until(() => docker('ps', '--format', 'json').split('\n').filter(Boolean).map(line => JSON.parse(line)).every(service => service.Health === 'healthy'));
    const services = docker('ps', '--format', 'json').split('\n').filter(Boolean).map(line => JSON.parse(line)).map(({ Service, State, Health }) => ({ service: Service, state: State, health: Health }));
    assert.equal(services.length, 5); assert.ok(services.every(s => s.health === 'healthy'));
    const git = (...command) => execFileSync('git', ['-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`, '--no-optional-locks', ...command], { encoding: 'utf8' }).trim();
    const sourceCommit = git('rev-parse', 'HEAD');
    const sourceFiles = ['docker-compose.yml', 'docker-compose.rubrica.yml', 'nginx.conf', 'scripts/prepare-infra-check.ps1', 'scripts/verify-redis-infra.cjs'].map(file => ({ file, sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') }));
    const result = { executedAt: new Date().toISOString(), sourceCommit, workingTreeChanges: Boolean(git('status', '--porcelain')), sourceFiles, project, result: 'passed', services, checks, circulation, limits: ['JWT sintetico de admin somente no ambiente descartavel; nao comprova login.', 'Ensaio curto nao comprova SLO de 30 dias nem E2E de navegador.'] };
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
    console.log('Integracao real aprovada; evidencia em ' + output);
  } finally { if (redisStopped) docker('start', 'redis'); }
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
