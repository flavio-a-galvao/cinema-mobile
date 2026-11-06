# Product Backlog — Cinemax

Base: `c826368`, branch `main`, levantamento em **05/11/2026**.
Este backlog é uma organização retrospectiva e um plano de aceite, não histórico
exportado do Jira. Existem **6 épicos, 16 User Stories, 6 Tasks e 2 Bugs** (30 itens).

## Estado e critérios de ordenação

US01–US13 descrevem comportamentos/artefatos já observados no código e commits;
o aceite de gestão continua pendente. US14–US16 são entregas propostas. Não há
sprints, responsáveis ou status Jira comprovados. O CSV sugere **To Do para todos**,
para validar/conciliar os itens após importação; isso não significa que o código
existente precise ser refeito. Não registrar Done apenas pela presença de commit.

P0 = essencial à integridade, à habilitação da gestão ou ao aceite da entrega;
P1 = suporte técnico/documental; P2 = melhoria posterior. No Jira, mapear P0/P1/P2
para Highest/High/Medium, conforme o esquema real. A ordem integra risco,
dependências e valor: um pré-requisito P1 pode anteceder um dependente P0.
Prioridades/estimativas são propostas para revisão, não decisões da equipe já tomadas.

Stories usam pontos relativos 1/2/3/5/8 para **validação, aceite e evidência restante**;
não estimam retroativamente a implementação. Tasks/Bugs usam horas previstas, sem
conversão de pontos em horas. Todos os responsáveis estão a confirmar.

## Épicos

| ID local | Objetivo |
| --- | --- |
| EP01 — Acesso e catálogo | Validar autenticação, titularidade e consulta pública do catálogo. |
| EP02 — Bilheteria e pagamentos | Preservar integridade da ocupação, emissão, pagamento simulado e cancelamento. |
| EP03 — Administração do cinema | Validar administração protegida de filmes, pôsteres, salas e sessões. |
| EP04 — Qualidade e infraestrutura | Verificar CI, Redis, Compose e integração reproduzível. |
| EP05 — Arquitetura, API e operação | Consolidar arquitetura, contratos, telemetria e procedimentos operacionais. |
| EP06 — Gestão, homologação e entrega | Estabelecer Jira real, aceite verificável e uma release rastreável. |

## Fila proposta de execução

IDs são locais, sem equivalência automática com chaves Jira. Dependências significam
pré-condições de validação/entrega, não que o código anterior ainda será implementado.
Tasks e Bugs são filhos do épico, no mesmo nível de Story; relação com uma Story
é associação/dependência, não Parent. Detalhes estão abaixo e no CSV.

| Ordem | ID | Tipo | Épico | Prioridade | Estimativa | Depende de | Versão proposta |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TK06 | Task | EP06 | P0 | 1 h | — | 1.0.0-rc.1 |
| 2 | TK01 | Task | EP06 | P0 | 2 h | TK06 | 1.0.0-rc.1 |
| 3 | US14 | Story | EP06 | P0 | 3 pt | TK01 | 1.0.0-rc.1 |
| 4 | US01 | Story | EP01 | P0 | 3 pt | — | 1.0.0-rc.1 |
| 5 | US02 | Story | EP01 | P0 | 2 pt | — | 1.0.0-rc.1 |
| 6 | US08 | Story | EP04 | P0 | 2 pt | — | 1.0.0-rc.1 |
| 7 | US06 | Story | EP03 | P0 | 3 pt | US01 | 1.0.0-rc.1 |
| 8 | US07 | Story | EP03 | P0 | 3 pt | US06 | 1.0.0-rc.1 |
| 9 | US09 | Story | EP04 | P1 | 5 pt | US02, US08 | 1.0.0-rc.1 |
| 10 | US10 | Story | EP04 | P0 | 5 pt | US08, US09 | 1.0.0-rc.1 |
| 11 | US03 | Story | EP02 | P0 | 5 pt | US01, US02, US07 | 1.0.0-rc.1 |
| 12 | US04 | Story | EP02 | P0 | 5 pt | US03 | 1.0.0-rc.1 |
| 13 | US05 | Story | EP02 | P1 | 3 pt | US03, US04 | 1.0.0-rc.1 |
| 14 | US12 | Story | EP05 | P1 | 3 pt | US01, US03, US04, US07 | 1.0.0-rc.1 |
| 15 | US13 | Story | EP05 | P1 | 3 pt | US09, US10, US12 | 1.0.0-rc.1 |
| 16 | TK02 | Task | EP05 | P1 | 1 h | — | 1.0.0-rc.1 |
| 17 | US11 | Story | EP05 | P1 | 3 pt | TK02 | 1.0.0-rc.1 |
| 18 | TK03 | Task | EP06 | P0 | 4 h | US10, US12 | 1.0.0-rc.1 |
| 19 | TK04 | Task | EP02 | P0 | 4 h | US10, US07, US01 | 1.0.0-rc.1 |
| 20 | US15 | Story | EP06 | P0 | 5 pt | US03, US04, US05, US07, US10, US12, TK03, TK04 | 1.0.0-rc.1 |
| 21 | US16 | Story | EP06 | P1 | 3 pt | US11, US13, US14, US15 | 1.0.0 |
| 22 | BUG01 | Bug | EP06 | P2 | 2 h | US10 | 1.0.1 |
| 23 | BUG02 | Bug | EP06 | P2 | 1 h | US02 | 1.0.1 |
| 24 | TK05 | Task | EP05 | P2 | 6 h | US13 | 1.1.0 |

As 16 Stories somam 56 pontos de validação propostos; isso não é velocidade.
As 6 Tasks e 2 Bugs somam 21 h estimadas, sem incluir espera por acesso,
provisionamento, 30 dias de medição ou correção de defeitos ainda desconhecidos.
Não somar horas e pontos para prometer uma data.

## User Stories e critérios de aceite

### US01 — Validar cadastro, login e acesso à própria conta

Como cliente, quero cadastrar e autenticar minha conta para acessar somente os recursos permitidos.

Épico EP01; P0; 3 pt. Justificativa: Três fronteiras de autorização e dados de teste distintos.

**Implementação/artefato observado; aceite pendente.** Commits: [54ca7e3](https://github.com/flavio-a-galvao/cinema-mobile/commit/54ca7e3), [c9e19d3](https://github.com/flavio-a-galvao/cinema-mobile/commit/c9e19d3), [58dda76](https://github.com/flavio-a-galvao/cinema-mobile/commit/58dda76), [2c9b3e8](https://github.com/flavio-a-galvao/cinema-mobile/commit/2c9b3e8).
Fontes: [Projeto-back-end/src/controllers/auth.controller.ts](../../Projeto-back-end/src/controllers/auth.controller.ts), [Projeto-back-end/src/controllers/users.controller.ts](../../Projeto-back-end/src/controllers/users.controller.ts), [Projeto-back-end/tests/usuarios.test.ts](../../Projeto-back-end/tests/usuarios.test.ts).

Critérios de aceite:

1. Cadastro público cria papel cliente e resposta não contém senha/hash; CPF/e-mail inválidos são rejeitados conforme contrato.
2. Login válido emite JWT; rota protegida sem JWT retorna 401; cliente em rota administrativa recebe 403.
3. Consulta de outra conta por cliente recebe 403; PUT só altera a própria conta e preserva o e-mail.

### US02 — Validar catálogo público de filmes e sessões

Como visitante, quero consultar filmes e sessões para escolher uma exibição.

Épico EP01; P0; 2 pt. Justificativa: Leituras já implementadas; conferir formatos e casos vazio/inexistente.

**Implementação/artefato observado; aceite pendente.** Commits: [54ca7e3](https://github.com/flavio-a-galvao/cinema-mobile/commit/54ca7e3), [8893d86](https://github.com/flavio-a-galvao/cinema-mobile/commit/8893d86).
Fontes: [Projeto-back-end/src/app.ts](../../Projeto-back-end/src/app.ts), [Projeto-back-end/src/controllers/filmes.controller.ts](../../Projeto-back-end/src/controllers/filmes.controller.ts), [Projeto-back-end/src/controllers/sessoes.controller.ts](../../Projeto-back-end/src/controllers/sessoes.controller.ts).

Critérios de aceite:

1. GET público de filmes/sessões funciona sem token; detalhe existente retorna 200 e inexistente retorna 404.
2. Sem page/limit há array; com paginação há data e pagination, conforme OpenAPI.
3. Pôster local ou substituto não altera a origem dos dados do catálogo; falhas observadas são registradas sem simular sucesso.

### US03 — Validar emissão em lote e ocupação

Como cliente, quero emitir de 1 a 10 ingressos para assentos da sessão para concluir minha seleção com integridade.

Épico EP02; P0; 5 pt. Justificativa: Transação, validações cruzadas e múltiplos cenários; concorrência real é TK04.

**Implementação/artefato observado; aceite pendente.** Commits: [cbb1a6e](https://github.com/flavio-a-galvao/cinema-mobile/commit/cbb1a6e), [58dda76](https://github.com/flavio-a-galvao/cinema-mobile/commit/58dda76).
Fontes: [Projeto-back-end/src/controllers/ingressos.controller.ts](../../Projeto-back-end/src/controllers/ingressos.controller.ts), [Projeto-back-end/src/utils/ensureIngressosSchema.ts](../../Projeto-back-end/src/utils/ensureIngressosSchema.ts), [Projeto-back-end/tests/crud.ingressos.test.ts](../../Projeto-back-end/tests/crud.ingressos.test.ts).

Critérios de aceite:

1. Lote válido retorna 201 com um ingresso por assento; quantidades inteira/meia coincidem com a seleção.
2. Duplicidade de assento, titularidade alheia, sala incompatível e sessão iniciada são rejeitadas conforme contrato.
3. Falha no lote não deixa emissão parcial; preço é calculado no servidor e não aceito do navegador.

### US04 — Validar pagamento simulado e retomada

Como cliente, quero registrar ou retomar o pagamento dos meus ingressos sem recriá-los.

Épico EP02; P0; 5 pt. Justificativa: Integridade entre dois recursos e recuperação após sucesso parcial da tela.

**Implementação/artefato observado; aceite pendente.** Commits: [58dda76](https://github.com/flavio-a-galvao/cinema-mobile/commit/58dda76), [813897e](https://github.com/flavio-a-galvao/cinema-mobile/commit/813897e).
Fontes: [Projeto-back-end/src/controllers/pagamentos.controller.ts](../../Projeto-back-end/src/controllers/pagamentos.controller.ts), [Projeto-back-end/src/controllers/compras.controller.ts](../../Projeto-back-end/src/controllers/compras.controller.ts), [Projeto-front-end/src/pages/Pagamento.jsx](../../Projeto-front-end/src/pages/Pagamento.jsx).

Critérios de aceite:

1. Registro de ingresso próprio ativo retorna 201 usando valor_unitario e data do servidor; valor/data enviados são ignorados.
2. Pagamento alheio recebe 403; duplicado ou ingresso cancelado recebe 409; não há segundo registro.
3. GET /me/compras mostra pendência e pagamento após registro; retomada mantém os IDs e não é apresentada como liquidação externa.

### US05 — Validar cancelamento e liberação do assento

Como cliente, quero cancelar meu ingresso antes da sessão para liberar a ocupação mantendo o histórico.

Épico EP02; P1; 3 pt. Justificativa: Estado, autorização e consulta de ocupação precisam ser verificados juntos.

**Implementação/artefato observado; aceite pendente.** Commits: [cbb1a6e](https://github.com/flavio-a-galvao/cinema-mobile/commit/cbb1a6e), [58dda76](https://github.com/flavio-a-galvao/cinema-mobile/commit/58dda76).
Fontes: [Projeto-back-end/src/controllers/ingressos.controller.ts](../../Projeto-back-end/src/controllers/ingressos.controller.ts), [Projeto-back-end/tests/crud.ingressos.test.ts](../../Projeto-back-end/tests/crud.ingressos.test.ts).

Critérios de aceite:

1. PATCH de ingresso próprio em sessão futura muda status para cancelado e preenche cancelado_em.
2. O assento sai da ocupação ativa da sessão, preservando o ingresso e eventual pagamento.
3. Cancelamento alheio recebe 403 e repetido/sessão iniciada recebe 409; não se promete estorno financeiro.

### US06 — Validar filmes e upload administrativo

Como administrador, quero manter filmes e pôsteres para publicar um catálogo consistente.

Épico EP03; P0; 3 pt. Justificativa: CRUD e upload já existem; validação de segurança aumenta o esforço.

**Implementação/artefato observado; aceite pendente.** Commits: [df3692a](https://github.com/flavio-a-galvao/cinema-mobile/commit/df3692a), [58dda76](https://github.com/flavio-a-galvao/cinema-mobile/commit/58dda76).
Fontes: [Projeto-back-end/src/controllers/filmes.controller.ts](../../Projeto-back-end/src/controllers/filmes.controller.ts), [Projeto-back-end/src/controllers/posters.controller.ts](../../Projeto-back-end/src/controllers/posters.controller.ts), [Projeto-back-end/tests/posters.test.ts](../../Projeto-back-end/tests/posters.test.ts).

Critérios de aceite:

1. CRUD exige admin; título inválido retorna 400 e filme com sessões impede exclusão com 409.
2. Upload JPEG/PNG/WebP válido retorna 200 e poster_url local; arquivo acima de 5 MiB retorna 413.
3. MIME/conteúdo inválidos recebem 400, sem persistir arquivo rejeitado; JSON de filme e cache são atualizados após sucesso.

### US07 — Validar salas, mapa e programação

Como administrador, quero configurar salas e sessões para disponibilizar lugares e horários válidos.

Épico EP03; P0; 3 pt. Justificativa: Três recursos relacionados e regras de preservação do histórico.

**Implementação/artefato observado; aceite pendente.** Commits: [fa05b1a](https://github.com/flavio-a-galvao/cinema-mobile/commit/fa05b1a), [f06d651](https://github.com/flavio-a-galvao/cinema-mobile/commit/f06d651).
Fontes: [Projeto-back-end/src/controllers/salasAssentos.controller.ts](../../Projeto-back-end/src/controllers/salasAssentos.controller.ts), [Projeto-back-end/src/controllers/sessoes.controller.ts](../../Projeto-back-end/src/controllers/sessoes.controller.ts), [Projeto-back-end/tests/geracao-assentos.test.ts](../../Projeto-back-end/tests/geracao-assentos.test.ts).

Critérios de aceite:

1. Sala usa capacidade 48 e geração repetida completa A1–F8 sem duplicar assentos.
2. Sessão exige filme/sala existentes, horário e preço válidos; mudanças impeditivas com ingressos retornam 409.
3. Mapa incompatível é rejeitado sem apagar dados; consultas e CRUD respeitam JWT/admin.

### US08 — Verificar execução do pipeline

Como mantenedor, quero validar testes e builds no CI para avaliar uma alteração antes da entrega.

Épico EP04; P0; 2 pt. Justificativa: Workflow existe; falta confirmar execução remota e guardar evidência.

**Implementação/artefato observado; aceite pendente.** Commits: [67645c9](https://github.com/flavio-a-galvao/cinema-mobile/commit/67645c9).
Fontes: [.github/workflows/ci.yml](../../.github/workflows/ci.yml), [docs/CI_DEPLOY.md](../../docs/CI_DEPLOY.md).

Critérios de aceite:

1. Há execução real do GitHub Actions identificada por URL/SHA, com testes e builds dos dois módulos web/API.
2. Falha de teste/build é sinalizada; E2E fora do CI básico não é apresentado como executado.
3. Job deploy-demo é identificado como demonstração e não como deploy de produção.

### US09 — Validar cache e eventos Redis

Como mantenedor, quero reaproveitar catálogo e observar eventos para reduzir consultas e verificar circulação de alterações.

Épico EP04; P1; 5 pt. Justificativa: Dois mecanismos com falhas/reconexão; diferenciar mocks e serviços reais.

**Implementação/artefato observado; aceite pendente.** Commits: [8893d86](https://github.com/flavio-a-galvao/cinema-mobile/commit/8893d86), [5c6a580](https://github.com/flavio-a-galvao/cinema-mobile/commit/5c6a580).
Fontes: [Projeto-back-end/src/services/catalogCache.ts](../../Projeto-back-end/src/services/catalogCache.ts), [Projeto-back-end/src/services/catalogEvents.ts](../../Projeto-back-end/src/services/catalogEvents.ts), [docs/evidencias/redis-infra.json](../../docs/evidencias/redis-infra.json).

Critérios de aceite:

1. Miss/hit, TTL e invalidação são verificáveis; falha de Redis mantém fallback ao MySQL.
2. Seis tipos de eventos de filmes/sessões usam canais e envelope reais; published/consumed se correlacionam por eventId.
3. Payload não contém JWT/dados pessoais; ausência de replay/durabilidade é explicitada e nenhuma escrita é repetida para repor evento.

### US10 — Revalidar ambiente integrado isolado

Como avaliador técnico, quero uma demonstração isolada de infraestrutura para conferir a comunicação entre componentes.

Épico EP04; P0; 5 pt. Justificativa: Reprodução em outro host depende de Docker, certificados e configuração.

**Implementação/artefato observado; aceite pendente.** Commits: [e23bd86](https://github.com/flavio-a-galvao/cinema-mobile/commit/e23bd86).
Fontes: [docker-compose.yml](../../docker-compose.yml), [scripts/verify-redis-infra.cjs](../../scripts/verify-redis-infra.cjs), [docs/INFRAESTRUTURA_DOCKER.md](../../docs/INFRAESTRUTURA_DOCKER.md).

Critérios de aceite:

1. Ambiente isolado usa Compose principal com cinco serviços e par TLS válido; dados do projeto padrão ficam preservados.
2. Verificador real registra resultado e ambiente/SHA, incluindo TLS, cache, fallback/recuperação e Pub/Sub.
3. Evidência nova é distinguida do JSON histórico; não se usa Compose legado sem Redis como prova da topologia principal.

### US11 — Revisar arquitetura C4, ADRs e DDD

Como avaliador, quero consultar a arquitetura e suas decisões para relacionar modelos ao código.

Épico EP05; P1; 3 pt. Justificativa: Artefatos existem; revisão semântica e apresentação ainda precisam de aceite.

**Implementação/artefato observado; aceite pendente.** Commits: [5228fab](https://github.com/flavio-a-galvao/cinema-mobile/commit/5228fab).
Fontes: [docs/arquitetura/README.md](../../docs/arquitetura/README.md), [docs/arquitetura/DDD.md](../../docs/arquitetura/DDD.md), [docs/arquitetura/QUALITY_SCENARIOS.md](../../docs/arquitetura/QUALITY_SCENARIOS.md).

Critérios de aceite:

1. C4 níveis 1/2 correspondem à topologia real; renderização GitHub fica registrada por TK02.
2. Seis ADRs identificam caráter retrospectivo; DDD separa modelo conceitual de classes implementadas.
3. Cenários de qualidade têm métricas e distinguem meta/evidência; links e fontes são verificáveis.

### US12 — Validar Swagger e cobertura OpenAPI

Como integrador, quero contratos navegáveis da API para usar corretamente rotas públicas e protegidas.

Épico EP05; P1; 3 pt. Justificativa: Contrato já validado localmente; visualização e proxy real permanecem a verificar.

**Implementação/artefato observado; aceite pendente.** Commits: [185f155](https://github.com/flavio-a-galvao/cinema-mobile/commit/185f155), [c826368](https://github.com/flavio-a-galvao/cinema-mobile/commit/c826368).
Fontes: [Projeto-back-end/src/docs/openapi.json](../../Projeto-back-end/src/docs/openapi.json), [Projeto-back-end/tests/openapi.test.ts](../../Projeto-back-end/tests/openapi.test.ts), [docs/API_OPENAPI.md](../../docs/API_OPENAPI.md).

Critérios de aceite:

1. Validador e comparação de rotas aprovam 52 operações/34 caminhos na base c826368; alterações futuras atualizam a contagem.
2. Swagger é acessível direto em /api-docs/ e no proxy em /api/api-docs/, com Try it out na raiz correta.
3. Bearer, admin, corpos, erros e respostas não usuais estão descritos sem credenciais; verificação visual é registrada somente após ocorrer.

### US13 — Revisar telemetria, resiliência e incidentes

Como operador, quero correlacionar falhas e consultar SLIs para diagnosticar incidentes sem expor dados sensíveis.

Épico EP05; P1; 3 pt. Justificativa: Revisão de segurança, semântica das métricas e procedimentos.

**Implementação/artefato observado; aceite pendente.** Commits: [c826368](https://github.com/flavio-a-galvao/cinema-mobile/commit/c826368).
Fontes: [docs/OBSERVABILIDADE_RESILIENCIA.md](../../docs/OBSERVABILIDADE_RESILIENCIA.md), [docs/RUNBOOK_INCIDENTES.md](../../docs/RUNBOOK_INCIDENTES.md), [docs/evidencias/observabilidade-local.json](../../docs/evidencias/observabilidade-local.json).

Critérios de aceite:

1. X-Request-Id e logs JSON permitem correlacionar HTTP e erro sanitizado; /metrics exige admin.
2. Testes confirmam fallback e retry limitado de startup, sem retry genérico de pagamento/emissão.
3. Runbook preserva volumes; SLOs são metas propostas e o ensaio local não é apresentado como janela mensal. Medição prolongada fica em TK05.

### US14 — Estabelecer gestão rastreável no Jira

Como participante confirmado do projeto, quero um backlog no Jira para tornar prioridades, dependências e aceite verificáveis.

Épico EP06; P0; 3 pt. Justificativa: Depende de acesso externo e revisão dos itens já existentes.

**Proposta; sem conclusão comprovada.** Fontes são pendências/documentos existentes ou este planejamento.
Fontes: [docs/gestao/JIRA_GUIA.md](../../docs/gestao/JIRA_GUIA.md), [docs/gestao/jira-import.csv](../../docs/gestao/jira-import.csv).

Critérios de aceite:

1. Projeto real é identificado por URL/key e acesso autorizado; itens existentes são conciliados antes de importar.
2. Seis épicos e 24 itens executáveis são conciliados, preservando autoria/status reais e ligando IDs locais às chaves criadas.
3. Quadro e permissões são verificados; capturas/URLs reais são registradas, sem retroagir datas ou simular movimentações.

### US15 — Homologar o fluxo web e a integração crítica

Como avaliador, quero percorrer o fluxo web e verificar concorrência real para conferir a integridade da demonstração.

Épico EP06; P0; 5 pt. Justificativa: Aceite integrado depende de evidências externas às suítes unitárias.

**Proposta; sem conclusão comprovada.** Fontes são pendências/documentos existentes ou este planejamento.
Fontes: [docs/CI_DEPLOY.md](../../docs/CI_DEPLOY.md), [Projeto-front-end/e2e/cinema.spec.ts](../../Projeto-front-end/e2e/cinema.spec.ts), [Projeto-back-end/tests/pagamentos.mysql.integration.cjs](../../Projeto-back-end/tests/pagamentos.mysql.integration.cjs).

Critérios de aceite:

1. E2E web e ensaio MySQL real de TK03/TK04 têm ambiente, SHA e resultado identificados; falhas viram bugs reproduzíveis.
2. Cadastro/login, catálogo, emissão, pagamento/retomada e cancelamento são verificados com dados sintéticos.
3. Relatório distingue cenário coberto, falha e não executado; o módulo mobile anterior permanece sem alteração.

### US16 — Qualificar uma release acadêmica

Como responsável pela entrega a ser confirmado, quero qualificar uma versão identificável para apresentar o escopo e seus limites.

Épico EP06; P1; 3 pt. Justificativa: Consolidação documental e aceite; sem estimar desenvolvimento histórico.

**Proposta; sem conclusão comprovada.** Fontes são pendências/documentos existentes ou este planejamento.
Fontes: [docs/gestao/PLANEJAMENTO_AGIL.md](../../docs/gestao/PLANEJAMENTO_AGIL.md), [docs/gestao/README.md](../../docs/gestao/README.md).

Critérios de aceite:

1. Checklist de rubrica, aceite e pendências é revisado por pessoas reais; notas da versão identificam SHA e limitações.
2. Tag/release só é criada em ação futura autorizada após aceite e validações; pacote versionado não é confundido com release.
3. Entrega registra o que foi demonstrado, autoria confirmada e procedimentos de recuperação, sem declarar SLO mensal ou Jira não comprovado.

## Tasks e Bugs

Na elaboração original, eram trabalho proposto e achados estáticos. A auditoria
final corrigiu BUG01/BUG02 no HTML; fonte local/CSP e idioma foram conferidos no
build. O CSV continua sendo preparo para conciliação/aceite, sem movimentação
Jira nem reprodução do defeito original no proxy real. Veja o
[relatório final](../RELATORIO_FINAL_RUBRICA.md).

### TK01 — Confirmar projeto e configurar importação/quadros

Task; EP06; P0; 2 h. Associado a US14.
Configuração externa; estimativa pressupõe acesso de administrador disponível.
Fontes: [docs/gestao/JIRA_GUIA.md](../../docs/gestao/JIRA_GUIA.md).

Aceite:

1. Registrar URL/key, tipo de projeto e permissões reais; procurar duplicados.
2. Validar mapeamento CSV e workflow em amostra, sem alterar issues existentes indiscriminadamente.

### TK02 — Conferir renderização dos diagramas no GitHub

Task; EP05; P1; 1 h. Associado a US11.
Inspeção focada dos diagramas existentes.
Fontes: [docs/arquitetura/README.md](../../docs/arquitetura/README.md).

Aceite:

1. Abrir C4/Context Map e registrar URL/SHA e captura legível.
2. Se houver erro, registrar localização e correção proposta; não declarar renderização só por inspeção de texto.

### TK03 — Executar E2E web com evidências sanitizadas

Task; EP06; P0; 4 h. Associado a US15.
Preparar dados e executar/revisar fluxo em navegador, com ambiente já disponível.
Fontes: [Projeto-front-end/e2e/cinema.spec.ts](../../Projeto-front-end/e2e/cinema.spec.ts), [docs/CI_DEPLOY.md](../../docs/CI_DEPLOY.md).

Aceite:

1. Executar a suíte configurada no ambiente descartável e registrar relatório, SHA e pré-condições.
2. Registrar falhas e limites; não reutilizar resultado unitário como prova de navegador.

### TK04 — Executar concorrência de ingresso/pagamento no MySQL real

Task; EP02; P0; 4 h. Associado a US03, US04, US15.
Preparação e interpretação de corrida real; duração não inclui solucionar eventual defeito.
Fontes: [Projeto-back-end/tests/pagamentos.mysql.integration.cjs](../../Projeto-back-end/tests/pagamentos.mysql.integration.cjs), [docs/arquitetura/QUALITY_SCENARIOS.md](../../docs/arquitetura/QUALITY_SCENARIOS.md).

Aceite:

1. Em ambiente isolado, registrar chamadas concorrentes e contagem SQL de ingressos ativos por sessão/assento.
2. Verificar um pagamento por ingresso; registrar conflitos reais e preservar dados fora do ensaio.

### TK05 — Planejar e iniciar coleta prolongada de SLIs

Task; EP05; P2; 6 h. Associado a US13.
6 h de preparação estimada, mais 30 dias decorridos para janela mensal; não é prova de medição existente.
Fontes: [docs/OBSERVABILIDADE_RESILIENCIA.md](../../docs/OBSERVABILIDADE_RESILIENCIA.md).

Aceite:

1. Configurar coleta externa e registrar reinícios/lacunas, sem armazenar JWT nas amostras.
2. Somente depois da janela observada avaliar SLOs; antes disso informar sem dados/série parcial.

### TK06 — Confirmar participantes, papéis e permissões

Task; EP06; P0; 1 h. Associado a US14.
Alinhamento curto, sujeito à disponibilidade real dos participantes.
Fontes: [docs/gestao/PLANEJAMENTO_AGIL.md](../../docs/gestao/PLANEJAMENTO_AGIL.md).

Aceite:

1. Obter lista confirmada de participantes/contas e acordo explícito sobre decisão de produto, execução e revisão.
2. Manter não atribuídos os itens sem pessoa confirmada; não converter autores Git em assignees automaticamente.

### BUG01 — Conciliar Google Fonts com a CSP vigente

Bug; EP06; P2; 2 h. Associado a US02.
Na base `8145040`, HTML apontava Google Fonts e a CSP aceitava estilo/fonte da
própria origem. A auditoria removeu as referências externas e preservou o
fallback local. Aceite de apresentação no ambiente real continua pendente.
Fontes: [Projeto-front-end/public/index.html](../../Projeto-front-end/public/index.html), [nginx.conf](../../nginx.conf), [docs/arquitetura/C4_CONTEXTO.md](../../docs/arquitetura/C4_CONTEXTO.md).

Aceite:

1. Registrar reprodução da requisição de fonte/stylesheet sob a CSP do proxy.
2. Escolher fonte local ou fallback aprovado e validar apresentação sem enfraquecer CSP/HSTS.

### BUG02 — Alinhar idioma declarado do HTML web

Bug; EP06; P2; 1 h. Associado a US02.
Na base `8145040`, o HTML declarava `lang="en"` apesar do conteúdo em português.
A auditoria corrigiu para `pt-BR` e conferiu o build; não é aprovação de teste
assistivo ou de issue Jira.
Fontes: [Projeto-front-end/public/index.html](../../Projeto-front-end/public/index.html).

Aceite:

1. Confirmar conteúdo predominante em português e alterar lang do documento web para pt-BR em tarefa futura.
2. Verificar atributo no HTML servido e ausência de alteração de contratos; documentar verificação de acessibilidade realizada.

## Regras de refinamento

Preservar IDs locais para conciliação. Ao descobrir falha nova, registrar reprodução,
ambiente/SHA, esperado/observado e impacto antes de classificá-la como Bug. Alterar
prioridade/estimativa com justificativa, mantendo o histórico real a partir da
adoção. Módulo mobile anterior está fora do escopo de alteração; pendências de seu
checklist não são tratadas aqui como resultados ou tarefas concluídas.
