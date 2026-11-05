# Arquitetura de Software — Cinemax

Documentação em português brasileiro, elaborada em **05/11/2026**, a partir do
código da branch `main`, base `e23bd86`. O escopo é a aplicação web e sua API;
`Projeto-mobile/` pertence ao módulo anterior e permanece fora desta entrega.

## Guia de avaliação

| Critério informado | Documento | Conteúdo para avaliação |
| --- | --- | --- |
| C4 nível 1 | [Contexto](C4_CONTEXTO.md) | Pessoas, fronteira do sistema e dependências externas reais |
| C4 nível 2 | [Containers](C4_CONTAINERS.md) | React, Express, MySQL, Redis, Nginx e protocolos |
| Decisões arquiteturais | [ADR-001](adrs/ADR-001-estilo-arquitetural.md), [ADR-002](adrs/ADR-002-organizacao-backend.md), [ADR-003](adrs/ADR-003-mysql-sequelize.md) | Estilo, organização interna e persistência |
| Decisões de infraestrutura | [ADR-004](adrs/ADR-004-cache-aside.md), [ADR-005](adrs/ADR-005-pubsub.md), [ADR-006](adrs/ADR-006-compose-nginx.md) | Cache, mensageria e implantação local |
| DDD estratégico | [Domínio e Context Map](DDD.md) | Subdomínios, Bounded Contexts, responsabilidades e relações |
| DDD tático | [Modelo de Bilheteria](DDD.md#modelo-tático-conceitual-de-bilheteria) | Entities, Value Objects, Aggregate e invariantes |
| Quality Scenarios | [Cenários de qualidade](QUALITY_SCENARIOS.md) | Desempenho, disponibilidade, resiliência, segurança e manutenibilidade |

O mapeamento cobre os critérios fornecidos no pedido. A rubrica integral da
instituição não está anexada; outros requisitos formais precisam ser conferidos
na entrega acadêmica.

## Como interpretar

- **Implementado:** observado nas fontes vinculadas em cada documento.
- **Conceitual/proposto:** análise arquitetural ou meta para futura avaliação;
  não representa classes, serviços ou resultados já existentes.
- **Evidência histórica:** arquivo já versionado, sem nova execução nesta etapa.
  O [registro de integração](../evidencias/redis-infra.json) declara `passed` em
  `2026-11-04T01:01:25.164Z` (03/11/2026 às 22:01:25 em Brasília).
- **ADRs retrospectivas:** registram decisões materializadas no código e suas
  justificativas técnicas inferidas. Não afirmam datas de decisão, reuniões,
  aprovação da equipe ou experimentos com as alternativas.

Os diagramas usam blocos `mermaid` com `flowchart`, sem extensões C4 ou serviços
externos de renderização. Os níveis seguem a abstração do C4 com notação própria
explicitada nas legendas. A inspeção estrutural não equivale a renderização.

## Base e limites da entrega

As fontes principais são [rotas da API](../../Projeto-back-end/src/app.ts),
[inicialização](../../Projeto-back-end/src/server.ts),
[Compose principal](../../docker-compose.yml),
[cliente HTTP](../../Projeto-front-end/src/services/api.ts) e os models/controllers.
Não houve mudança funcional, instalação de dependências ou execução de Docker.

Validação desta etapa: resolução dos links locais, âncoras e cercas de código;
conferência estrutural dos diagramas e rastreabilidade com as fontes; `git diff
--check` e confirmação de que o módulo anterior não mudou. Não há parser Mermaid
disponível nas dependências locais nem comando `mmdc` no PATH: a sintaxe foi
revisada estruturalmente, mas os diagramas **não foram renderizados nem validados
por um parser Mermaid**. Conferir a visualização no GitHub permanece pendente.

Consulte também [CI e deploy](../CI_DEPLOY.md), [cache](../CACHE_REDIS.md),
[Pub/Sub](../REDIS_PUBSUB.md), [infraestrutura](../INFRAESTRUTURA_DOCKER.md) e
[DER](../DER.md). A suíte automatizada e a integração não foram reexecutadas
para esta alteração exclusivamente documental.
