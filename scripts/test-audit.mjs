import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '..');
const project = 'cinemax-audit-' + randomUUID();
const temp = mkdtempSync(join(tmpdir(), 'cinemax-audit-'));
const envFile = join(temp, 'test.env');
const override = join(temp, 'test.yml');
const config = {
  ENV_FILE: envFile, DB_ROOT_PASSWORD: 'fixture-root', DB_NAME: 'cinema_db',
  DB_USER: 'audit_test', DB_PASS: 'fixture-db', JWT_SECRET: randomUUID() + randomUUID(),
  REDIS_URL: 'redis://redis:6379',
};
writeFileSync(envFile, Object.entries(config).map(([key, value]) => key + '=' + value.replaceAll('\\', '/')).join('\n') + '\n');
writeFileSync(override, 'services:\n  backend:\n    ports: !override ["127.0.0.1::3000"]\n');

const docker = (args, stdio = ['ignore', 'pipe', 'inherit']) =>
  execFileSync('docker', args, { cwd: root, env: { ...process.env, ...config }, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio })?.trim();
const prefix = ['compose', '-p', project, '--env-file', envFile, '-f', 'docker-compose.yml', '-f', override];
const compose = (...args) => docker([...prefix, ...args]);
const channel = 'cinemax:eventos:filmes';
const subscribers = () => Number(compose('exec', '-T', 'redis', 'redis-cli', '--raw', 'PUBSUB', 'NUMSUB', channel).split('\n').at(-1));
const rows = () => JSON.parse(compose('exec', '-T', 'auditoria', 'node', '--no-warnings', '-e',
  "const db=new (require('node:sqlite').DatabaseSync)(process.env.AUDIT_DB_PATH,{readOnly:true}); console.log(JSON.stringify(db.prepare('SELECT * FROM audit_events ORDER BY rowid').all()))"));
const pid = service => {
  const id = compose('ps', '-q', service);
  assert(id);
  return docker(['inspect', '--format', '{{.Id}} {{.State.Pid}}', id]);
};
const workerLog = action => compose('logs', '--no-color', 'auditoria').includes('"action":"' + action + '"');
const replay = message => compose('exec', '-T', 'redis', 'redis-cli', 'PUBLISH', channel, message);

async function until(label, condition) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await condition()) return;
    await delay(1000);
  }
  throw new Error('Tempo excedido: ' + label);
}

try {
  docker([...prefix, 'up', '-d', '--build', '--wait', '--wait-timeout', '120', 'backend', 'auditoria'], 'inherit');
  const api = 'http://' + compose('port', 'backend', '3000');
  await until('Subscriber interno e serviço independente inscritos', () => subscribers() === 2);
  const backendPid = pid('backend');
  const auditPid = pid('auditoria');
  assert.notEqual(backendPid, auditPid);
  console.log('Processos distintos:', { backendPid, auditPid });
  const token = compose('exec', '-T', 'backend', 'node', '-e',
    "console.log(require('jsonwebtoken').sign({id_usuario:1,tipo_usuario:'admin'},process.env.JWT_SECRET,{expiresIn:'10m'}))");

  async function createFilm(suffix) {
    const title = 'Teste de auditoria ' + suffix;
    const response = await fetch(api + '/filmes', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ titulo: title }), signal: AbortSignal.timeout(8000),
    });
    assert.equal(response.status, 201);
    const { id_filme: id } = await response.json();
    assert(Number.isSafeInteger(id));
    const lookup = await fetch(api + '/catalogo/filmes/' + id, { signal: AbortSignal.timeout(8000) });
    assert.equal(lookup.status, 200);
    assert.equal((await lookup.json()).titulo, title);
    console.log(suffix, { id, post: 201, get: 200, subscribers: subscribers() });
    return id;
  }

  const first = await createFilm('online');
  await until('evento gravado no SQLite', () => rows().some(row => row.entity_id === first));
  const saved = rows().find(row => row.entity_id === first);
  const line = compose('logs', '--no-color', 'backend').split('\n').find(log => log.includes('"action":"published"') && log.includes(saved.event_id));
  assert(line, 'O evento gravado deve ter o mesmo eventId do backend');
  console.log('Evento correlacionado:', saved);

  replay(JSON.stringify({ eventId: saved.event_id, type: saved.event_type, id: saved.entity_id, timestamp: saved.occurred_at }));
  replay('{"type":"film.created","filmId":1}');
  await until('duplicata e payload antigo identificados', () => workerLog('duplicate') && workerLog('invalid_event'));
  assert.deepEqual(rows(), [saved]);
  console.log('Duplicata e evento inválido não alteraram a tabela.');

  compose('stop', 'auditoria');
  await until('apenas o Subscriber interno permanece', () => subscribers() === 1);
  const missed = await createFilm('auditoria parada');

  compose('up', '-d', '--no-deps', '--force-recreate', 'auditoria');
  await until('assinatura restaurada', () => subscribers() === 2);
  const restarted = pid('auditoria');
  assert.notEqual(restarted, auditPid);
  assert.equal(pid('backend'), backendPid);
  assert.deepEqual(rows(), [saved]);
  const next = await createFilm('auditoria reiniciada');
  await until('novo evento gravado', () => rows().some(row => row.entity_id === next));
  const final = rows();
  assert.equal(final.length, 2);
  assert(!final.some(row => row.entity_id === missed));
  console.log('OK: SQLite preservado, processo reiniciado, novo evento gravado e evento desconectado sem replay.', { restarted, final });
} finally {
  try { compose('down', '--volumes'); }
  finally { unlinkSync(override); unlinkSync(envFile); rmdirSync(temp); }
}
