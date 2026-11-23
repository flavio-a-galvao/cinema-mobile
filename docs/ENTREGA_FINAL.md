# Cinemax — evidências e roteiro de entrega

Conferência em 23/11/2026, horário de São Paulo. Este registro separa código integrado, candidato a integração e resultados anteriores. A escala abaixo usa os 12 critérios A1–A5/B1–B4/T1–T3 transcritos no [relatório de avaliação](RELATORIO_FINAL_RUBRICA.md), sem atribuir nota. A cópia PDF encontrada em `referencias/` é a rubrica anterior de Mobile/Engenharia, com Tech Forge centrado em upload e papéis. Para confirmar pesos ou requisitos adicionais da etapa avançada, use a rubrica vigente da disciplina.

| Versão | O que mostrar | Evidência |
| --- | --- | --- |
| `main` `21c1904` | API, React, pôster substituto local do PR #7, Redis, observabilidade, Swagger, CI e Compose padrão | [Main](https://github.com/flavio-a-galvao/cinema-mobile/commit/21c1904d4c7ef3fce7bce361fb92005e0d61f7dc), [CI da main](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45118101224), [pôster](evidencias/kan-12-poster.md) |
| PR #8 `18a1aed` | Candidato com processo Node.js de auditoria no perfil opcional `audit` e SQLite. PR aberto, sem conflitos, CI aprovado, sem aprovação humana registrada | [PR](https://github.com/flavio-a-galvao/cinema-mobile/pull/8), [CI](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610), [prova Docker](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610/job/137508631835) |
| Branch `docs/cinemax-entrega-main` | Documentação sobre a main; a candidata do PR #8 é referenciada por evidências separadas | Este documento e o diff documental |

## Cobertura da rubrica avançada

| Critério | O que está demonstrado e qual é o limite |
| --- | --- |
| A1 — Documentação arquitetural | [C4](arquitetura/README.md), seis ADRs retrospectivos e [cenários de qualidade](arquitetura/QUALITY_SCENARIOS.md). O nível de contêineres do candidato mostra o perfil `audit` e SQLite. Renderização local do candidato validada com Mermaid 12.3.0 e Chrome 158. [Contexto](evidencias/entrega-final/c4-contexto.png) e [Contêineres](evidencias/entrega-final/c4-containers.png). As [capturas anteriores](evidencias/auditoria/local.json) permanecem históricas; não houve teste da renderização no GitHub. |
| A2 — Estilos e DDD | [Context Map e modelo tático](arquitetura/DDD.md) documentam o backend monolítico de negócio. A auditoria consome metadados fora do fluxo transacional e não decompõe os contextos. |
| A3 — Integração, APIs e dados | [OpenAPI/Swagger](API_OPENAPI.md) com 52 operações e 34 caminhos na prova anterior, mais ADR MySQL/Sequelize. O consumidor do PR não abre HTTP e não altera a API. O ensaio visual anterior de Swagger não substitui um teste no Nginx real do ambiente de apresentação. |
| A4 — Qualidade, resiliência e observabilidade | [Logs, métricas e SLOs](OBSERVABILIDADE_RESILIENCIA.md) e [runbook](RUNBOOK_INCIDENTES.md). Há teste de correlação e fallback. As metas de 30 dias não são medição realizada, e os logs da auditoria não são métricas da API. |
| A5 — Entrega contínua | [CI/CD e rollback](CI_DEPLOY.md). Testes/builds reais na main e no PR. O job demonstrativo de deploy foi pulado e não houve deploy de produção. |
| B1 — Cache Redis | A [prova Docker anterior](evidencias/complementacao/resumo.json), base `d59723b`, registra miss/hit, TTL, invalidação e fallback. O job novo não re-testou toda a política de cache. |
| B2 — Mensageria Pub/Sub | A main publica e consome internamente seis tipos. No PR #8, o Docker demonstrou `filme.created` entre processos, deduplicação, persistência, disponibilidade da API durante a parada e nova assinatura após recriar o consumidor. Os seis tipos têm cobertura unitária no serviço novo. Não há replay de mensagens perdidas. |
| B3 — Docker e Nginx | O ensaio anterior verificou cinco serviços, MySQL, Redis e Nginx/HTTPS. O CI do PR verificou API, MySQL, Redis e auditoria reais, sem Nginx/HTTPS nessa execução. O perfil mantém a topologia padrão inalterada. |
| B4 — Boas práticas e observabilidade | Camadas existentes, erros tratados e logs sanitizados. No candidato, campos e canais são validados, SQL é parametrizado e a chave única evita duplicação. Volume SQLite precisa de backup e controle de espaço. |
| T1 — Jira | [KAN](https://cinemax-projeto.atlassian.net/jira/software/projects/KAN/boards/2) com 31 itens acadêmicos, 25 relações de pai e 42 dependências Blocks. Há rastreabilidade e histórico efetivo em KAN-12, KAN-18 e KAN-34, consolidados no [comentário de KAN-24](https://cinemax-projeto.atlassian.net/browse/KAN-24?focusedCommentId=10004). O [registro de gestão](gestao/JIRA_GUIA.md) distingue importação, trabalho, revisão e aceite. |
| T2 — Cynefin e abordagem | [Análise](gestao/CYNEFIN.md) fundamenta domínio complicado e abordagem híbrida com Kanban. |
| T3 — Ciclo de vida e entregas | [Plano](gestao/PLANEJAMENTO_AGIL.md), backlog priorizado, transições reais e [três snapshots de fontes com SHA-256](evidencias/complementacao/entregas.json). A consulta remota nesta conferência não retornou tags nem releases. Restam homologação, responsáveis/papéis confirmados e evidência de publicação se exigida na avaliação. |

## Roteiro de 5 a 7 minutos

1. **Arquitetura.** Abra C4 Contexto e Contêineres, ADRs e DDD. Mostre a API de negócio no diagrama da main e use a captura do candidato para o consumidor opcional do PR #8. No [Swagger](API_OPENAPI.md), mostre o contrato e separe rotas públicas das administrativas. Na stack HTTPS configurada, abra `https://cinema.local/api/api-docs/`.
2. **Redis e SQLite.** Na branch do PR, execute o comando abaixo. Destaque PIDs distintos e o `eventId` da API no SQLite. Mostre que duplicata e evento inválido não gravam, que o backend responde com o consumidor parado e que recriar somente a auditoria preserva o volume e recebe novos eventos. Mostre também a perda durante a parada, sem prometer replay.
3. **Testes e CI.** Abra o CI da main e o do PR. O último registra 420 testes no backend, 3 na auditoria e a prova Docker. O E2E de navegador e o deploy real estão fora desses checks. A [execução local separada](evidencias/entrega-final/e2e-main-21c1904.json) passou nos 11 cenários da suíte Chromium em main 21c1904 com API e MySQL descartáveis, sem Nginx/TLS, Redis ou checkout no navegador.
4. **Gestão.** Abra o Kanban e o histórico de [KAN-34](https://cinemax-projeto.atlassian.net/browse/KAN-34?focusedCommentId=10003). Mostre o vínculo com o épico KAN-9, o PR, o log de execução e as transições reais. Use KAN-12 e KAN-18 como outros casos em revisão. Nenhum aceite foi pressuposto.

Em **clone/worktree separado**, com Node.js 24, Docker Engine e Compose 2.24.4+:

```powershell
git fetch origin main feat/kan-34-auditoria-redis
git worktree add --detach ../cinemax-demo 18a1aed
Set-Location ../cinemax-demo
npm --prefix Projeto-auditoria test
node scripts/test-audit.mjs
```

O roteiro automatizado cria apenas uma stack Docker descartável própria, sem depender de banco de produção ou TLS. Se o Docker local estiver indisponível, mostre o [log completo do CI](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610/job/137508631835) como execução no runner. Use o [guia Docker/HTTPS](INFRAESTRUTURA_DOCKER.md) para a demonstração separada do proxy.

## Perguntas prováveis

- **Por que Pub/Sub e não uma fila?** É fan-out: cada assinante conectado recebe o evento. Não há replay nem garantia de entrega durante desconexão. Streams ou outbox seriam opções se a durabilidade fosse requisito.
- **O que o SQLite garante?** Preserva os eventos recebidos e gravados com o volume montado. A chave única por `eventId` evita duplicatas. O MySQL continua sendo a fonte de dados de negócio.
- **O consumidor causa indisponibilidade da API?** No ensaio, a API permaneceu ativa e retornou 201 e 200 com a auditoria parada. Após recriá-la, ela recebeu um evento novo e manteve o registro anterior.
- **O que é main e o que é candidato?** Main tem Redis e Subscriber interno. O PR #8 adiciona um processo separado no perfil opcional. A prova Docker foi executada no runner.
- **O CI prova produção e SLO?** Comprova builds, testes e ensaio isolado do PR. A suíte web existente passou separadamente em Chromium. Checkout no navegador, deploy real e medição de 30 dias continuam fora dessa prova.
- **O Jira foi só importado?** Não. Mostre o histórico real da KAN-34 e os vínculos com CI e PR. As minutas e comentários técnicos não equivalem ao aceite.

[Minutas KAN-12/18/24](gestao/ACEITES_TECNICOS.md) · [Notas e checklist da candidata](RELEASE_1.0.0-rc.1.md).

## Fechamento

- **Titular:** provisionar ambiente de demonstração quando disponível, confirmar os papéis reais em KAN-32 e decidir sobre publicação dos snapshots/versões e atualização documental. As evidências em KAN-19 e KAN-20 podem ser conciliadas com o ensaio anterior; KAN-28 depende de verificar a renderização no GitHub no SHA apresentado. KAN-29 já tem evidência da suíte Chromium. KAN-26 ainda requer validação dos fluxos de compra/retomada/cancelamento no navegador e conciliação com a prova separada de concorrência MySQL.
- **Colega:** revisar o candidato no GitHub e registrar sua decisão real no PR. A aprovação formal ainda não foi registrada.
- **Depois:** com autorização do titular e revisão, integrar por squash, conferir o SHA e o CI da main e anexá-los à KAN-34. Só mover para Done após aceite real dos 11 critérios. Sem isso, apresentar o microserviço como candidato testado.
