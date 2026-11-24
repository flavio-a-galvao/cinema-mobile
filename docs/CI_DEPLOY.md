# Integração contínua, testes e deploy

O repositório contém aplicações independentes em `Projeto-back-end/` (TypeScript,
Express e Vitest), `Projeto-front-end/` (React, Jest e Playwright) e
`Projeto-mobile/` (módulo anterior, fora desta configuração).

## Preparação e validação local

Use Node.js 24 e npm. Na raiz:

```sh
npm ci
npm --prefix Projeto-back-end ci
npm --prefix Projeto-front-end ci
npm run validate:push
npm --prefix Projeto-back-end run build
npm --prefix Projeto-front-end run build
```

O `prepare` instala os hooks Husky. O pre-push executa todos os testes Vitest do
back-end e Jest do front-end uma vez, sem modo watch, navegador ou Docker.
Falhas interrompem o envio. Os testes unitários usam mocks e não exigem banco.
O hook commit-msg mantém a validação da mensagem com commitlint.
O tipo `ci` é aceito para alterações de integração contínua.
O Vitest fornece valores fictícios de banco apenas durante os testes e transforma
o utilitário puro de checkout importado do módulo anterior sem instalar Expo.
Nenhum arquivo de `Projeto-mobile/` é modificado por essa configuração.

Para executar separadamente:

```sh
npm --prefix Projeto-back-end test
npm --prefix Projeto-front-end test -- --watchAll=false --runInBand
```

## Playwright (execução explícita)

A seleção padrão inclui `e2e/cinema.spec.ts`. O cenário `e2e/bilheteria.spec.ts`, integrado pelo PR #10, entra na seleção quando `E2E_KAN26_MOVIE_ID` está definido. Execute em ambiente descartável, com API e front-end na mesma origem. A configuração abaixo usa `https://cinema.local` por padrão.

Na auditoria, helpers foram alinhados à segurança da API: cadastro público nunca
cria admin e não existe DELETE de usuário. Provisione conta administrativa
somente no banco descartável e configure `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`
na sessão, sem versionar credenciais. Confirme `CINEMAX_E2E_ISOLATED=1` antes de
executar. Os usuários sintéticos permanecem no ambiente isolado; o teste não
declara limpeza inexistente nem exclui volumes. A capacidade de sala testada é 48.
`E2E_BASE_URL` permite outro host de teste explicitamente configurado.

Configure `.env` a partir de `.env.example`, o certificado `certs/cinema.local.crt`
e sua chave privada correspondente `certs/cinema.local.key` (ausente no clone;
gere um par local se necessário, sem versionar a chave), e a resolução
de `cinema.local` para `127.0.0.1` no arquivo hosts. Com Docker Compose instalado,
na raiz (PowerShell):

```powershell
npm --prefix Projeto-front-end exec -- playwright install chromium
docker compose -p cinemax-e2e -f docker-compose.test.yml up -d --build
try {
  # Aguarde banco, API e https://cinema.local ficarem disponíveis antes dos testes.
  $env:CINEMAX_E2E_ISOLATED = '1'
  # E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD: conta de teste provisionada previamente.
  npm --prefix Projeto-front-end run test:e2e -- --project=chromium --reporter=list
  if ($LASTEXITCODE -ne 0) { throw 'Playwright falhou' }
} finally {
  docker compose -p cinemax-e2e -f docker-compose.test.yml down
}
```

O Compose de testes é usado isoladamente para não herdar volumes de código e
banco do ambiente de desenvolvimento. As portas 80/443 precisam estar livres.
O `down` preserva o volume de testes; use um banco de testes limpo para repetir
cenários. Não execute essa suíte contra dados reais. Para os três navegadores,
instale-os com `playwright install` e omita `--project=chromium`.
A suíte Chromium anterior passou nos 11 cenários em `21c1904` com API e MySQL descartáveis em HTTP loopback. O checkout foi verificado separadamente em Chromium com API real e MySQL 9.1 descartável. A árvore ensaiada em `5633ad8` corresponde ao squash `43380fe`. O relatório inclui como provisionar a sessão e executar somente o cenário de bilheteria. [Suíte anterior](evidencias/entrega-final/e2e-main-21c1904.json) · [Bilheteria e pré-condições](https://github.com/flavio-a-galvao/cinema-mobile/blob/43380fe32682d9b04de9f3db74617fc5bbfc6abc/docs/evidencias/kan-26-correcao-web.md)
O navegador exige certificado confiável: `ignoreHTTPSErrors` permanece falso;
instale/confie na CA local conforme a política do notebook, sem contornar avisos.

## GitHub Actions

`.github/workflows/ci.yml` executa em push, pull request e acionamento manual.
Cada aplicação tem instalação reprodutível com `npm ci`, cache npm, testes e build
em job separado. Falhas não são ignoradas. Os E2E ficam fora do CI básico porque
exigem o ambiente isolado descrito acima. Em `43380fe`, os testes e builds de web/API passaram. O deploy demonstrativo ficou `skipped`. [CI da main](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45433562530)

Na candidata do [PR #8](https://github.com/flavio-a-galvao/cinema-mobile/pull/8), o job adicional de auditoria verifica Node.js, SQLite e integração Docker em ambiente isolado. A [execução do HEAD 18a1aed](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610) passou. Esse job não está na main de referência `43380fe` e não executa o E2E web ou deploy.
Referência: [CI Node.js do GitHub](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).

## Deploy e rollback

O job `deploy-demo` só roda por **Run workflow**, marcando `demonstrate_deploy`,
depois de ambos os jobs de validação passarem. Ele registra uma demonstração no
resumo do workflow; **não publica a aplicação** e não usa credenciais de deploy.

Para um deploy real futuro: gerar artefatos/imagens imutáveis identificados pelo
SHA aprovado (`dist/` do back-end com dependências de produção e `build/` estático
do front-end); validar em homologação; aprovar produção; aplicar no servidor com
variáveis e segredos externos ao Git; conferir login, API e compra. O Compose
atual usa servidores e volumes de desenvolvimento e não é um manifesto de produção.

Registrar a versão anterior e fazer backup do banco antes de mudanças de schema.
Para rollback, reaplicar os artefatos/imagens do último SHA estável e verificar
os mesmos fluxos. Reversão de código não desfaz dados: migrações precisam de plano
compatível e restauração de backup apenas quando necessária e avaliada quanto à
perda de dados. Não usar force push para reverter uma implantação.
