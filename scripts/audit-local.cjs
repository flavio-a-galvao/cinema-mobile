// Auditoria local do build/diagramas: não inicia banco, Redis, Docker ou servidor de produção.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomUUID, createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const backend = createRequire(path.join(root, 'Projeto-back-end/package.json'));
const frontend = createRequire(path.join(root, 'Projeto-front-end/package.json'));
const { chromium } = frontend('playwright');
const destination = path.join(root, 'docs/evidencias/auditoria');
fs.mkdirSync(destination, { recursive: true });

Object.assign(process.env, {
  NODE_ENV: 'test', DB_NAME: 'auditoria_sem_banco', DB_USER: 'teste', DB_PASS: randomUUID(),
  JWT_SECRET: randomUUID() + randomUUID(), REDIS_URL: '',
});

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
function diagrams() {
  const list = [];
  for (const file of files(path.join(root, 'docs'))) {
    if (file.endsWith('.mmd')) list.push({ file: path.relative(root, file), block: 1, code: fs.readFileSync(file, 'utf8') });
    if (file.endsWith('.md')) {
      let block = 0;
      for (const match of fs.readFileSync(file, 'utf8').matchAll(/^```mermaid\r?\n([\s\S]*?)^```/gm)) {
        list.push({ file: path.relative(root, file), block: ++block, code: match[1] });
      }
    }
  }
  return list;
}

(async () => {
  const records = [], logs = [], savedConsole = {};
  for (const level of ['info', 'warn', 'error']) {
    savedConsole[level] = console[level];
    console[level] = line => { try { logs.push(JSON.parse(line)); } catch {} };
  }
  const express = backend('express');
  const app = backend('./dist/app').default;
  const sequelize = backend('./dist/config/database').default;
  const jwt = backend('jsonwebtoken');
  const policy = /add_header Content-Security-Policy "([^"]+)" always;/.exec(fs.readFileSync(path.join(root, 'nginx.conf'), 'utf8'))[1];
  const host = express();
  // Mesma CSP, sem afirmar que isso constitui um teste do Nginx real.
  host.use((_req, res, next) => { res.setHeader('Content-Security-Policy', policy); next(); });
  host.use('/api', app);
  host.use(app);
  const server = host.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser, webServer;
  try {
    const requestId = randomUUID();
    for (const prefix of ['', '/api']) {
      for (const [route, status] of [['/', 200], ['/api-docs/', 200], ['/api-docs/openapi.json', 200], ['/metrics', 401], ['/filmes', 401]]) {
        const response = await fetch(base + prefix + route, { headers: { 'X-Request-Id': requestId } });
        await response.text();
        assert.equal(response.status, status);
        assert.equal(response.headers.get('x-request-id'), requestId);
        records.push({ method: 'GET', route: prefix + route, status, correlationVerified: true });
      }
    }
    const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(login.status, 400); await login.text();
    records.push({ method: 'POST', route: '/auth/login', status: 400 });
    const token = jwt.sign({ id_usuario: 1, email: 'auditoria@example.test', tipo_usuario: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1m' });
    const snapshotResponse = await fetch(base + '/metrics', { headers: { Authorization: 'Bearer ' + token } });
    assert.equal(snapshotResponse.status, 200);
    assert.equal(snapshotResponse.headers.get('cache-control'), 'no-store');
    const snapshot = await snapshotResponse.json();
    assert.ok(snapshot.business.completedRequests >= 3);
    records.push({ method: 'GET', route: '/metrics', status: 200, adminVerified: true });

    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    const policyErrors = [];
    page.on('console', message => { if (message.type() === 'error' && /Content Security Policy|violates.*directive/i.test(message.text())) policyErrors.push(message.text()); });
    await page.goto(base + '/api/api-docs/');
    await page.locator('.swagger-ui .info .title').waitFor();
    await page.waitForFunction(() => document.querySelectorAll('.opblock').length === 52);
    assert.equal(await page.locator('.errors-wrapper').count(), 0);
    assert.deepEqual(policyErrors, []);
    await page.screenshot({ path: path.join(destination, 'swagger-local.png') });
    const swagger = { rendered: true, browser: 'Chrome headless', browserVersion: browser.version(), operations: 52, policy: 'CSP copiada do nginx.conf; proxy real não iniciado', cspErrors: policyErrors.length };

    // Renderiza o build real da SPA; identidade somente de UI, sem alegar login/CRUD integrado.
    const web = express();
    const buildDirectory = path.join(root, 'Projeto-front-end/build');
    web.use((_req, res, next) => { res.setHeader('Content-Security-Policy', policy); next(); });
    web.use(express.static(buildDirectory));
    web.use((_req, res) => res.sendFile(path.join(buildDirectory, 'index.html')));
    webServer = web.listen(0, '127.0.0.1');
    await new Promise(resolve => webServer.once('listening', resolve));
    const formPage = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    await formPage.addInitScript(() => localStorage.setItem('cineMaxSession', JSON.stringify({
      email: 'auditoria@example.test', tipo_usuario: 'admin', nome: 'UI sintetica', token: 'sem-token-real',
    })));
    await formPage.route('https://cinema.local/api/**', route => route.abort());
    await formPage.goto(`http://127.0.0.1:${webServer.address().port}/admin/salas/nova`);
    await formPage.locator('input[name="capacidade"]').waitFor();
    assert.equal(await formPage.locator('input[name="capacidade"]').inputValue(), '48');
    assert.equal(await formPage.locator('input[name="capacidade"]').isEditable(), false);
    assert.equal(await formPage.locator('html').getAttribute('lang'), 'pt-BR');
    assert.equal(await formPage.locator('link[href*="fonts.googleapis.com"]').count(), 0);
    await formPage.screenshot({ path: path.join(destination, 'salas-local.png') });
    const frontendRender = { rendered: true, route: '/admin/salas/nova', htmlLang: 'pt-BR', capacity: 48, readOnly: true,
      scope: 'Build SPA real; identidade de UI simulada. Não é login ou CRUD integrado com MySQL.' };

    const mermaidFile = process.env.MERMAID_BUNDLE || path.join(process.env.TEMP, 'cinemax-audit-tools/node_modules/mermaid/dist/mermaid.min.js');
    assert.ok(fs.existsSync(mermaidFile), 'Prepare Mermaid temporário conforme relatório ou informe MERMAID_BUNDLE.');
    const diagramPage = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
    await diagramPage.setContent('<html><head><style>body{margin:20px;background:white}svg{max-width:1560px}</style></head><body></body></html>');
    await diagramPage.addScriptTag({ path: mermaidFile });
    const rendered = [];
    for (const [index, diagram] of diagrams().entries()) {
      const result = await diagramPage.evaluate(async ({ code, index }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
        await mermaid.parse(code);
        const { svg } = await mermaid.render('auditDiagram' + index, code);
        document.body.innerHTML = svg;
        return { svg, width: document.querySelector('svg').getBoundingClientRect().width };
      }, { code: diagram.code, index });
      assert.ok(result.width > 0);
      const important = /arquitetura[\\/](C4_CONTEXTO|C4_CONTAINERS|DDD)\.md$/.test(diagram.file);
      let artifact;
      if (important) {
        artifact = path.basename(diagram.file, '.md').toLowerCase();
        fs.writeFileSync(path.join(destination, artifact + '.svg'), result.svg);
        await diagramPage.screenshot({ path: path.join(destination, artifact + '.png'), fullPage: true });
      }
      rendered.push({ file: diagram.file.replaceAll('\\', '/'), block: diagram.block, parsed: true, rendered: true,
        sha256: createHash('sha256').update(diagram.code).digest('hex'), ...(artifact ? { artifact: artifact + '.svg' } : {}) });
    }
    const report = { executedAt: new Date().toISOString(), scope: 'Build backend real em HTTP local, CSP simulada e Mermaid em navegador; sem banco/Redis/Nginx reais',
      result: 'passed', node: process.version,
      mermaidVersion: JSON.parse(fs.readFileSync(path.resolve(path.dirname(mermaidFile), '../package.json'), 'utf8')).version,
      http: records, swagger, frontend: frontendRender, metrics: snapshot, diagrams: rendered, logs };
    const serialized = JSON.stringify(report, null, 2) + '\n';
    assert.ok(!serialized.includes(token)); assert.ok(!serialized.includes(process.env.JWT_SECRET));
    fs.writeFileSync(path.join(destination, 'local.json'), serialized);
    for (const level of Object.keys(savedConsole)) console[level] = savedConsole[level];
    console.log(`Auditoria local aprovada: ${records.length} verificações HTTP, Swagger 52 operações e ${rendered.length} diagramas parseados/renderizados.`);
  } finally {
    if (browser) await browser.close();
    if (webServer) await new Promise(resolve => webServer.close(resolve));
    await new Promise(resolve => server.close(resolve));
    await sequelize.close();
    for (const level of Object.keys(savedConsole)) console[level] = savedConsole[level];
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
