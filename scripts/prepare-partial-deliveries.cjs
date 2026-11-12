// Gera snapshots de fontes; nao cria tags, releases, commits ou versoes publicadas.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], { cwd: root, encoding: 'utf8' }).trim();
const destination = path.join(root, '.audit-tmp/entregas');
fs.mkdirSync(destination, { recursive: true });
const milestones = [
  ['infra', 'e23bd86', ['8893d86', '5c6a580', 'e23bd86'], 'Cache, Pub/Sub e infraestrutura; prova historica Redis, sem homologacao atual inferida.'],
  ['arquitetura-api-observabilidade', 'c826368', ['5228fab', '185f155', 'c826368'], 'C4/DDD/ADRs, OpenAPI e telemetria; testes historicos distintos de integracao real.'],
  ['gestao-auditoria', 'd59723b', ['8145040', 'd59723b'], 'Backlog e auditoria final; Jira, aceite e publicacao continuam pendentes.'],
];
const artifacts = milestones.map(([name, ref, commits, scope]) => {
  const sha = git('rev-parse', `${ref}^{commit}`);
  git('merge-base', '--is-ancestor', sha, 'main');
  const file = `.audit-tmp/entregas/cinemax-${name}-${ref}.zip`;
  const output = path.join(root, file);
  if (!fs.existsSync(output)) git('archive', '--format=zip', `--prefix=cinemax-${ref}/`, `--output=${output}`, sha);
  // Verifica o arquivo existente contra um archive novo do mesmo SHA, sem sobrescreve-lo.
  const expected = execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'archive', '--format=zip', `--prefix=cinemax-${ref}/`, sha], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  const hash = data => createHash('sha256').update(data).digest('hex');
  const bytes = fs.readFileSync(output);
  if (hash(bytes) !== hash(expected)) throw new Error(`Archive divergente: ${file}`);
  return { name, sha, commits: commits.map(commit => git('rev-parse', `${commit}^{commit}`)), scope, file, bytes: bytes.length, sha256: hash(bytes), state: 'source-snapshot-not-released' };
});
const evidence = { checkedAt: new Date().toISOString(), baseline: git('rev-parse', 'HEAD'), tagsCreated: 0, releasesPublished: 0, artifacts };
fs.mkdirSync(path.join(root, 'docs/evidencias/complementacao'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/evidencias/complementacao/entregas.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
