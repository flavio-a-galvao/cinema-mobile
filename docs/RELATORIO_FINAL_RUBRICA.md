# Relatório final da rubrica — Cinemax

## Complementação de 11/11/2026 — base d59723b

Estado inicial: `main` limpa e igual ao SHA remoto
`d59723b90a8c738590627e551b5d4b3dc14438be`, confirmado por `ls-remote` antes
das alterações. Trabalho limitado a evidências, preparo de entregas e gestão;
sem reimplementar requisitos atendidos ou modificar `Projeto-mobile/`.

### Lacunas e correções verificadas

- **Back-end B1/B2/B3:** desconto original decorre da falta de repetição atual
  de cache/TTL/invalidação/fallback, circulação Pub/Sub e Compose/MySQL/Nginx/HTTPS.
  Docker CLI 27.4.0 estava sem Engine; iniciar o Desktop disponibilizou Engine
  Linux 27.4.0. O ensaio foi preparado em projeto novo com volumes próprios e
  portas 18080/18443, preservando o proxy existente na porta 80. **Integração real
  aprovada**, com cinco serviços healthy e nove verificações, incluindo TLS,
  persistência MySQL, miss/hit/TTL/invalidação, fallback/recuperação e seis tipos
  Pub/Sub com publicação/consumo correlacionados por eventId.
  [Evidência nova](evidencias/complementacao/infra-cinemax-rubrica-1a9aa7106a28.json);
  prova histórica preservada sem alterações.
- **Tech Forge T1:** titular confirmou inexistência de projeto Jira. Mantidos
  **0/1**, sem criar/alterar dados externos. [CSV validado](evidencias/complementacao/jira-csv.json):
  30 registros (6 Epic/16 Story/6 Task/2 Bug), 42 dependências existentes e sem
  ciclos, IDs locais únicos, pais anteriores aos filhos, prioridades e fila
  consistentes. Campos adicionais e mapeamento dependem do Jira real. O
  [guia](gestao/JIRA_GUIA.md) cobre company-managed e team-managed Cloud.
- **Tech Forge T3:** preparados três snapshots cumulativos de fontes dos SHAs
  `e23bd86`, `c826368`, `d59723b`, gerados por `git archive` e conferidos por
  SHA-256/bytes contra nova geração. [Manifesto](evidencias/complementacao/entregas.json)
  e [plano revisado](gestao/PLANEJAMENTO_AGIL.md). Não são versões publicadas nem
  aceite de entregas. Nenhuma tag remota encontrada na consulta; nenhuma tag/release
  criada nesta etapa. Condução Jira, homologação e publicação continuam pendentes.
  Mantida estimativa conservadora de **0,5/1** para T3.
- Corrigidas contradições de BUG01/BUG02 no CSV/backlog/plano: correções já estão
  em `d59723b`; conciliar aceite na baseline candidata, sem reservar um patch para
  refazer código. Preservados IDs, 30 registros, status propostos e histórico Git.
- Corrigido risco do ensaio: projeto fixo/volumes reutilizáveis e sobrescrita de
  `redis-infra.json` foram substituídos por projeto aleatório, validação do mount,
  arquivos locais exclusivos e evidência nova sem sobrescrita. Override de portas
  permite ensaio sem parar os serviços existentes. Nenhuma alteração funcional
  na API/web foi necessária.
- Ajustado o verificador ao contrato de correlação UUID e à política existente
  de bypass por TTL. Tentativas iniciais falharam com observação de cache expirada
  e interferência do bypass nos casos seguintes; esses resultados não foram
  contabilizados como aprovação. A execução completa final usa TTL padrão de
  60 s, observa valor/prazo atomicamente e testa CRUD/cache saudável antes da
  interrupção controlada. Nenhuma asserção de sucesso foi removida.

### Validações desta complementação

| Verificação | Resultado atual |
| --- | --- |
| CSV/backlog | Validador executado; 30 registros, 42 dependências, sem ciclos; destino Jira não validado |
| Testes backend relevantes | **45/45, 6 arquivos**: cache, controllers de cache, Pub/Sub, controllers Pub/Sub, observabilidade e databaseReadiness; [JSON](evidencias/complementacao/backend-testes.json) |
| Build TypeScript backend | `npm --prefix Projeto-back-end run build`: aprovado |
| Compose principal + override rubrica | `config --quiet` aprovado: cinco serviços, backend sem porta pública, proxy em loopback, volumes com prefixo exclusivo |
| Builds Docker backend/frontend | Aprovados com Node 24 e lockfiles existentes; containers iniciaram com imagens construídas nesta etapa |
| Integração real | **9 verificações aprovadas**; cinco serviços healthy; `nginx -t`, TLS validado, Redis/MySQL/PubSub e métricas reais |
| MySQL isolado | **6/6 verificações** (teste principal e cinco subtestes), zero falhas/skips; preço, titularidade, recuperação e concorrência pagamento/ingresso; [log](evidencias/complementacao/mysql-integracao.txt) |
| HTML pelo proxy HTTPS | HTTP 200, `lang=pt-BR`, sem referências Google Fonts; [resultado](evidencias/complementacao/html-proxy.json). Não é teste visual de navegador |
| Preservação de evidência | Segunda chamada com mesmo arquivo foi recusada antes de mutações; SHA-256 da evidência permaneceu igual |
| Entregas parciais | Três ZIPs locais gerados, SHAs ancestrais de main e SHA-256 conferidos; não publicados |
| Documentação | Links locais e cercas Markdown conferidos; `git diff --check` sem erros |

A primeira tentativa de Vitest no sandbox foi bloqueada por EPERM no cache
temporário (zero testes executados); a repetição fora dele aprovou os 45 testes.
Dependências foram instaladas somente no backend, pelo lockfile, sem scripts de
instalação nem mudanças de versões. Resultados de 420/5 testes e CI abaixo são
históricos; não foram reapresentados como reexecução desta etapa.

### Pendências do titular e apresentação

Criar/configurar Jira, confirmar participantes, autorizar importação e registrar
uso/aceite reais. Selecionar SHA/versão após homologação e autorizar tag/release
verdadeiras. E2E completo de navegador e coleta prolongada de SLIs não foram
executados nesta complementação; SLO de 30 dias não é requisito comprovado por
ensaio curto. O [checklist final](CHECKLIST_APRESENTACAO_FINAL.md) lista comandos,
telas e gates, separando integração técnica de gestão/publicação.

**Estimativa potencial revisada:** Arquitetura **3,000/3** (escopo já atendido,
preservado), Back-end **3,000/3** (B1=1,000; B2=0,500; B3=1,000; B4=0,500),
Tech Forge **1,500/3** (T1=0,000; T2=1,000; T3=0,500); total **7,500/9**.
Nenhum ponto adicional por CSV, ZIP local ou operação Jira não realizada.
É estimativa de cobertura, não promessa de nota. Para atingir potencial de 9/9,
faltam uso Jira comprovado e condução/aceite/entrega versionada reais, sujeitos
à avaliação do professor. [Consolidado verificável](evidencias/complementacao/resumo.json).

O ambiente de demonstração foi encerrado com `stop`, sem remover volumes; seu
`run.json` permanece local em `.audit-tmp/infra/cinemax-rubrica-1a9aa7106a28/`.
Tentativas interrompidas podem ter deixado dados sintéticos nesse banco novo;
isso não é banco de produção. Credenciais/chaves são locais e ignoradas pelo Git.

## Registro histórico da auditoria de 05/11/2026

Auditoria realizada em **05/11/2026, horário de Brasília**, sobre `main`, base
`8145040`. Os oito commits anteriores foram preservados. O estado inicial estava
limpo e igual ao `origin/main` consultado. O escopo abrange web, API, infraestrutura
e documentação; **`Projeto-mobile/` não foi alterado**.

## Referência oficial e método

Foram conferidos o texto e a imagem da página única do PDF fornecido pelo usuário.
Usam-se exatamente seus 12 critérios e pesos: Arquitetura 3,0, Back-end 3,0 e
Tech Forge 3,0, total **9,0 pontos**. As marcações existentes no formulário não
foram interpretadas como nota já atribuída ao Cinemax. A parcela adicional de
até 3 pontos do projeto fica **sem estimativa**, pois não tem descritores suficientes.

As classificações abaixo significam:

- **Atendido:** artefato/implementação conferido com fontes e verificações
  compatíveis com o que o critério efetivamente pede.
- **Parcial:** parte verificável, mas há execução, entrega ou evidência relevante faltante.
- **Pendente de comprovação:** não há acesso/evidência suficiente para concluir.
- **Não atendido:** ausência confirmada do requisito, diferente de um teste bloqueado.

A estimativa aplica a escala oficial de 100%, 75%, 50%, 25% e 0% ao peso do
critério. É uma **avaliação conservadora de cobertura**, não resultado matemático
de testes nem promessa de nota. Não se concede ponto Jira só por CSV, release só
por versão de pacote ou integração real só por mocks.

## Matriz oficial — Arquitetura de Software

| ID e critério | Máximo | Situação verificada | Potencial conservador | Evidências e limite |
| --- | --- | --- | --- | --- |
| A1 — Documentação arquitetural | 0,5 | Atendido | 0,500 | C4 Contexto/Containers, 6 ADRs e 8 Quality Scenarios revisados; parser/renderização local de Mermaid e inspeção das imagens. [Índice](arquitetura/README.md), [cenários](arquitetura/QUALITY_SCENARIOS.md), [resultado](evidencias/auditoria/local.json) |
| A2 — Estilos arquiteturais e DDD | 1,0 | Atendido | 1,000 | Monólito/camadas técnicas coerentes com rotas/controllers; Context Map, 6 Bounded Contexts, domínios/subdomínios e modelo tático de Bilheteria. Conceitual e implementado diferenciados. [DDD](arquitetura/DDD.md), [ADR-001](arquitetura/adrs/ADR-001-estilo-arquitetural.md), [ADR-002](arquitetura/adrs/ADR-002-organizacao-backend.md) |
| A3 — Integração, APIs e dados | 0,5 | Atendido | 0,500 | OpenAPI 3.0.3 válido, 52 operações/34 caminhos, correspondência automática com rotas e Swagger renderizado; ADR MySQL/Sequelize fundamentada no código. [API](API_OPENAPI.md), [especificação](../Projeto-back-end/src/docs/openapi.json), [ADR-003](arquitetura/adrs/ADR-003-mysql-sequelize.md), [captura](evidencias/auditoria/swagger-local.png) |
| A4 — Qualidade, resiliência e observabilidade | 0,5 | Atendido | 0,500 | SLIs/SLOs mensuráveis, logs/correlação/métricas demonstrados localmente, timeout/fallback/retry seguro testados e justificativa de não adotar breaker artificial. O critério pede documento/estratégias/plano; metas não são resultados mensais. [Guia](OBSERVABILIDADE_RESILIENCIA.md), [testes](../Projeto-back-end/tests/observability.test.ts), [evidência](evidencias/auditoria/local.json) |
| A5 — Entrega contínua | 0,5 | Atendido | 0,500 | Pipeline esqueleto build/test/deploy-demo, estratégia simples/rollback e runbook; CI real da base com backend/frontend bem-sucedidos, deploy-demo corretamente skipped. A rubrica não exige deploy produtivo efetivo. [Workflow](../.github/workflows/ci.yml), [CI/deploy](CI_DEPLOY.md), [runbook](RUNBOOK_INCIDENTES.md), [GitHub](evidencias/auditoria/github.json) |
| **Subtotal** | **3,0** | **Cobertura verificada no escopo descrito** | **3,000** | Não equivale a certificação de produção, resultado de carga ou nota do professor |

### Conferência detalhada de Arquitetura

| Subrequisito | Conferência concreta |
| --- | --- |
| C4 Contexto e Containers | Pessoas e imagens externas reais; React no navegador, Nginx de entrada/estático, Express, MySQL e Redis corretos. [Contexto SVG](evidencias/auditoria/c4_contexto.svg), [containers SVG](evidencias/auditoria/c4_containers.svg) |
| ADRs | Seis registros com contexto, decisão, justificativa, alternativas, consequências e status retrospectivo; não há histórico de reuniões inventado |
| Quality Scenarios | Oito cenários com origem/estímulo/ambiente/artefato/resposta/métrica; metas e provas separadas, sem benchmark ou SLO mensal presumido |
| Context Map e Bounded Contexts | Relações U/D explicadas como semânticas, não microsserviços inexistentes. [Mapa SVG](evidencias/auditoria/ddd.svg) |
| Entities, Value Objects e Aggregates | Ingresso e referências externas, VOs candidatos e Aggregate Root explícitos; não se afirma domínio puro implementado |
| OpenAPI/Swagger | Parser e testes HTTP/rotas reais; UI com 52 operações, sem erros de CSP no ensaio local; Nginx/HTTPS reais continuam fora desse ensaio |
| ADR de banco | Dialect MySQL, Sequelize/mysql2, transações, DECIMAL, coluna gerada e unicidade, evolução de schema e consequências documentadas |
| SLOs/SLIs/resiliência/observabilidade | Contadores/histograma por processo, reset e população definidos; resultados locais não extrapolados para disponibilidade de 30 dias |
| CI/CD/deploy/rollback/runbook | [Execução real da base](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/42138386775); não se afirma execução de deploy-demo ou implantação produtiva |

## Matriz oficial — Back-end Avançado

| ID e critério | Máximo | Situação verificada | Potencial conservador | Evidências e risco de perda de pontos |
| --- | --- | --- | --- | --- |
| B1 — Cache Redis | 1,0 | Parcial para comprovação atual | 0,750 | Cache-aside, TTL, invalidação e fallback implementados; 8 testes da política e testes de controllers passaram. Prova real histórica disponível, mas não repetida neste notebook. [Serviço](../Projeto-back-end/src/services/catalogCache.ts), [guia](CACHE_REDIS.md), [integração histórica](evidencias/redis-infra.json) |
| B2 — Mensageria Pub/Sub | 0,5 | Parcial para comprovação atual | 0,375 | Publicação/consumo, seis tipos de evento, reconexão e logs correlacionados implementados; 12 testes da política e testes de controllers aprovados. Logs reais históricos comprovam circulação; falta repetição atual. [Serviço](../Projeto-back-end/src/services/catalogEvents.ts), [guia](REDIS_PUBSUB.md), [logs históricos](evidencias/redis-infra.json) |
| B3 — Docker Compose e Nginx | 1,0 | Parcial | 0,750 | Ambos manifestos passam em config --quiet e proxy/topologia conferidos; evidência histórica de cinco serviços, HTTPS e healthchecks. Daemon Linux indisponível impediu up/healthchecks/nginx -t e prova atual. [Principal](../docker-compose.yml), [E2E](../docker-compose.test.yml), [proxy](../nginx.conf), [infraestrutura](INFRAESTRUTURA_DOCKER.md) |
| B4 — Boas práticas e observabilidade | 0,5 | Atendido quanto ao descritor | 0,500 | Controllers/services/middlewares/models e interfaces de entrada existentes; logs estruturados, dados sensíveis filtrados, erros centrais e métricas testados. Não se afirma camada DTO/DDD separada ou segurança sem riscos residuais. [Código](../Projeto-back-end/src/app.ts), [logger](../Projeto-back-end/src/services/logger.ts), [erros](../Projeto-back-end/src/middlewares/observability.ts), [testes](evidencias/auditoria-backend-testes.json) |
| **Subtotal** | **3,0** | **Integração atual ainda bloqueada** | **2,375** | **2,38 arredondados**; 75% nos três critérios que dependem da repetição de infraestrutura |

A prova histórica registra execução real em `2026-11-04T01:01:25.164Z`, vinculada
à etapa `e23bd86`, com miss/hit, TTL, invalidação, fallback, recuperação e Pub/Sub.
Ela é mais que documentação declaratória, mas **não foi reexecutada nem
reapresentada como resultado atual**. O professor pode avaliar essa evidência;
a estimativa manteve margem conservadora até repetição/demonstração.

## Matriz oficial — Tech Forge

| ID e critério | Máximo | Situação verificada | Potencial conservador | Evidências e pendência |
| --- | --- | --- | --- | --- |
| T1 — Gestão pelo Jira | 1,0 | Pendente de comprovação | 0,000 | Plugin Atlassian não instalado/conectado; não foi possível consultar projeto, issues, atribuições ou movimentações reais. CSV/guia não substituem uso do Jira. [Guia](gestao/JIRA_GUIA.md), [CSV](gestao/jira-import.csv) |
| T2 — Cynefin e abordagem | 1,0 | Atendido | 1,000 | Domínio complicado justificado com concorrência, Redis e configuração; comparação preditiva/ágil/híbrida e escolha híbrida com Kanban. É análise fundamentada, sem workshop fictício. [Cynefin](gestao/CYNEFIN.md) |
| T3 — Planejamento e condução do ciclo de vida | 1,0 | Parcial | 0,500 | Backlog priorizado: 6 épicos, 16 Stories, 6 Tasks, 2 Bugs; critérios/dependências/estimativas/fluxo/papéis propostos e releases SemVer. Faltam condução real e implementação/comprovação de versões parciais: zero tags/releases verificadas. [Backlog](gestao/PRODUCT_BACKLOG.md), [plano](gestao/PLANEJAMENTO_AGIL.md), [GitHub](evidencias/auditoria/github.json) |
| **Subtotal** | **3,0** | **Gestão real e releases não comprovadas** | **1,500** | Não foram inventados assignees, sprints, Done ou lançamentos |

O caminho escolhido usa execução ágil/Kanban, aceito no descritor; não se exige
PM Canvas como se a abordagem tivesse sido predominantemente preditiva. Os
papéis estão definidos como responsabilidades a confirmar, sem nomear membros
por inferência dos autores Git. O CSV continua com To Do proposto, inclusive nos
bugs corrigidos tecnicamente, até conciliação/aceite no Jira real.

## Estimativa consolidada

| Disciplina | Máximo oficial | Potencial conservador nesta auditoria |
| --- | --- | --- |
| Arquitetura de Software | 3,0 | 3,000 |
| Back-end Avançado | 3,0 | 2,375 |
| Tech Forge | 3,0 | 1,500 |
| **Componentes** | **9,0** | **6,875 ≈ 6,88** |
| Nota adicional do projeto | Até 3,0 | **Não estimada: descritores insuficientes** |

Não é promessa de nota. Não há comprovação para declarar 100% geral. A maior
lacuna é gestão demonstrada no Jira; em seguida, releases e repetição da prova
integrada no host de apresentação. A infraestrutura antiga comprovada não deve
ser descartada nem confundida com validação atual.

## Problemas encontrados e corrigidos

| Problema concreto | Correção e validação |
| --- | --- |
| npm ci do frontend falhava no npm local por yaml ausente no lockfile | Lockfile reconciliado; instalação limpa final bem-sucedida, testes/build aprovados |
| Formulário web enviava capacidade 40 e gerava fileiras de 10, incompatíveis com A1–F8 | Capacidade fixa 48 e uso do endpoint transacional/idempotente de geração existente. Dois testes de regressão e renderização do build; sem novo contrato API |
| E2E tentava criar admin pelo cadastro público e deletar usuário por rota inexistente | Admin agora vem de conta provisionada no ambiente descartável; login usa /auth/login; limpeza inexistente não é afirmada; suite exige confirmação de isolamento |
| Fixture MySQL de sala usava capacidade 2, rejeitada pelo model atual | Fixture corrigida para 48, guard de ambiente descartável e cenário concorrente de ingresso/cancelamento acrescentados; sintaxe conferida, execução MySQL pendente |
| Compose E2E ignorava ENV_FILE e exigia .env ausente mesmo com env isolado | env_file aceita ENV_FILE preservando default .env; dois manifestos validados sem daemon |
| JWT usava fallback público também em produção | Produção rejeita segredo ausente/curto/público; cinco testes novos; compatibilidade de desenvolvimento/teste e contratos preservados |
| HTML declarava en e Google Fonts contrariava CSP | pt-BR e fallback local; fontes externas removidas sem reduzir a política; build/DOM conferidos |
| Dependências com alertas corrigíveis | Lockfiles atualizados dentro das faixas existentes, sem force/major; instalações, testes e builds repetidos nas versões finais |
| Documentos ainda descreviam ausência de parser/renderização/inspeção visual | Registros históricos preservados e atualização da auditoria vinculada às novas evidências |

As correções dos Bugs de gestão são alterações técnicas, **sem aceitação Jira
inventada**. Não houve refatoração arquitetural extensa ou alteração das rotas
de negócio. Nenhum comando de remoção de volume, prune, reset ou force push foi
utilizado.

## Execuções realizadas e bloqueadas

| Verificação/comando | Resultado efetivo | Evidência |
| --- | --- | --- |
| npm ci nos módulos web/backend, após correções | Aprovado com lockfiles finais | Registrado nesta auditoria; hashes/versionamento no consolidado |
| npm --prefix Projeto-back-end test -- --silent | **420 testes, 28 arquivos aprovados**, incluindo Redis, Pub/Sub, Swagger, logs e produção JWT | [JSON backend](evidencias/auditoria-backend-testes.json) |
| npm --prefix Projeto-front-end test -- --watchAll=false --runInBand | **5 testes, 2 arquivos aprovados** | [JSON frontend](evidencias/auditoria-frontend-testes.json) |
| npm --prefix Projeto-back-end run build | TypeScript aprovado | [Consolidado](evidencias/auditoria/resumo.json) |
| npm --prefix Projeto-front-end run build | Build estático aprovado | [Consolidado](evidencias/auditoria/resumo.json); aviso Browserslist antigo não é erro de compilação |
| npm --prefix Projeto-back-end run validate:openapi | OpenAPI 3.0.3 válido, 34 caminhos/52 operações | [Contrato](../Projeto-back-end/src/docs/openapi.json) e teste automático |
| node scripts/audit-local.cjs | 12 verificações HTTP, métricas/admin, Swagger e SPA renderizados; **18 diagramas parseados/renderizados** | [JSON](evidencias/auditoria/local.json), [Swagger](evidencias/auditoria/swagger-local.png), [sala](evidencias/auditoria/salas-local.png) |
| Playwright --list --project=chromium | 11 testes descobertos; **não executa os cenários** | Configuração/arquivos E2E; execução integrada permanece pendente |
| node --check no ensaio MySQL e no auditor | Sintaxe aprovada | Scripts versionados; não equivale a integração SQL |
| prepare-infra-check.ps1 | Arquivo de ambiente e par TLS locais preparados, ignorados pelo Git | Nenhum segredo/chave adicionado ao commit |
| docker compose --env-file .env.infra-check -p cinemax-infra-check config --quiet | Manifesto principal aprovado | [Consolidado](evidencias/auditoria/resumo.json) |
| Mesmo comando com -f docker-compose.test.yml | Manifesto E2E aprovado | [Consolidado](evidencias/auditoria/resumo.json) |
| docker version e inicialização do Desktop/serviço | Daemon Linux não disponível: dockerDesktopLinuxEngine ausente | [Consolidado](evidencias/auditoria/resumo.json) |
| up/healthchecks/nginx -t/HTTPS/Redis/PubSub reais atuais | **Não executados**, bloqueados pelo daemon | [Prova histórica preservada](evidencias/redis-infra.json) |
| GitHub Actions público | Jobs backend/frontend success no SHA 8145040; deploy-demo skipped | [JSON GitHub](evidencias/auditoria/github.json) |
| Jira e releases | Jira sem conexão; API pública retornou zero releases e tags remotas não encontradas | Guia local/GitHub; nenhum registro externo fabricado |

O ensaio local importa o build real de `app.ts`, sem iniciar `server.ts`, banco
ou Redis. Requisições exercitam documentação, autenticação negada e entrada
inválida; não simulam uma compra concluída. A SPA é renderizada com identidade
**somente de UI**, explicitamente sintética. Isso não comprova login ou CRUD
integrado. A CSP é copiada de `nginx.conf` para o servidor de teste: não é Nginx
ou HTTPS real. Os PNGs C4/DDD/Swagger e da sala foram inspecionados.

## Segurança básica e riscos residuais

[Registro de segurança](evidencias/auditoria/seguranca.json): a varredura básica
de texto do estado atual não encontrou padrões de chave privada, token GitHub,
AWS ou JWT literal; não é auditoria de todo o histórico nem garantia de ausência
de qualquer segredo. `.env.infra-check` e chave TLS local são ignorados pelo Git.

- Backend: apontamentos npm de produção **9 → 2**, restando 2 moderados na
  cadeia Sequelize/uuid; **zero altos/críticos** após correções compatíveis.
- Frontend: **67 → 35** apontamentos, sem críticos, mas com 13 altos, 6 moderados
  e 16 baixos, principalmente da cadeia legada CRA/build/teste. Não se afirma
  que todos integrem o JavaScript servido ou sejam exploráveis em produção.
- Não se aplicou a sugestão incompatível de downgrade Sequelize 3 ou troca de
  react-scripts para 0.0.0. Revisão/migração dessas cadeias exige tarefa própria.
- A API conserva CORS amplo e sessão web em localStorage. TLS entre containers,
  alta disponibilidade, backups automáticos, auditoria completa e carga não
  foram implementados nem atestados por esta etapa.

## Ações para concluir a comprovação

1. **Docker:** corrigir instalação/inicialização do Docker Desktop/WSL até
   `docker version` mostrar Server; reutilizar projeto isolado, jamais apagar
   volumes existentes. Executar os comandos de [infraestrutura](INFRAESTRUTURA_DOCKER.md)
   e `node scripts/verify-redis-infra.cjs`; guardar prova nova com data/SHA,
   preservando o registro histórico.
2. **E2E/MySQL:** CA confiável, conta admin sintética provisionada no banco de
   teste, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` e `CINEMAX_E2E_ISOLATED=1`.
   Executar os 11 cenários, distinguindo falha de caso não executado. Para o
   ensaio SQL, configurar banco descartável e `CINEMAX_MYSQL_INTEGRATION_ISOLATED=1`
   antes de `node --test tests/pagamentos.mysql.integration.cjs` no backend.
3. **Jira:** habilitar acesso Atlassian e confirmar site/projeto/key reais.
   Conferir duplicatas e membros; importar [CSV](gestao/jira-import.csv) pelo
   importador administrativo conforme [guia](gestao/JIRA_GUIA.md). Mapear Parent,
   tipos e prioridades; distribuir responsáveis reais. Atualizar status apenas
   conforme execução/aceite e coletar URLs/capturas de épicos, issues e quadro.
4. **Versões:** executar os gates do [plano](gestao/PLANEJAMENTO_AGIL.md), confirmar
   aceite e então criar tag/release verdadeira em ação futura autorizada.
   Commits/pacotes existentes não devem ser renomeados retroativamente como releases.
5. **Operação:** coletar SLIs na janela definida, registrar gaps/reinícios e
   investigar alertas legados. Metas SLO não se tornam resultados por existir `/metrics`.

## Roteiro objetivo de apresentação

1. Abra esta matriz e a rubrica: explique pesos, limites e pontuação potencial.
2. Mostre C4 renderizado, ADR-001/003 e Context Map; aponte no código a topologia,
   os models e as regras de Bilheteria, distinguindo conceitos DDD de classes reais.
3. Abra o Swagger e o contrato; mostre rota pública, Bearer/admin, erros e
   correspondência automática dos endpoints. Use conta sintética, sem capturar JWT.
4. Apresente os JSONs de 420/5 testes, builds e execução CI real da base. Explique
   que o deploy do esqueleto é demonstrativo e mostre rollback/runbook.
5. Com Docker funcional, demonstre cache miss/hit/TTL/invalidação e pares
   published/consumed por eventId. Se o ambiente continuar bloqueado, identifique
   claramente a evidência histórica e não alegue demonstração ao vivo.
6. Consulte métricas admin e um X-Request-Id nos logs sanitizados. Mostre o limite
   de medição por processo e por que não se promete SLO mensal com poucas amostras.
7. No Jira real, apresente backlog, responsáveis e movimentos ocorridos. Enquanto
   não houver acesso, mostre CSV/guia como preparo e assuma a pendência. Termine
   com Cynefin, ciclo de vida, versões propostas e lançamentos efetivamente comprovados.

## Reproduzir a verificação visual local

Depois de instalar dependências pelos lockfiles e construir ambos os módulos,
use Chrome já instalado e Mermaid somente em pasta temporária:

```powershell
npm install --prefix "$env:TEMP/cinemax-audit-tools" --no-audit --no-fund mermaid
node scripts/audit-local.cjs
```

`MERMAID_BUNDLE` permite informar o bundle já disponível, evitando nova instalação.
Versões efetivas de Node, Chrome e Mermaid ficam no JSON. A verificação local não
altera banco/Redis nem depende de liberar autenticação ou portas de produção.
