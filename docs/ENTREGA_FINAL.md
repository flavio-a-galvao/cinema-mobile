# Cinemax — evidências e roteiro de entrega

> **Atualização de 25/11/2026:** [PR #8](https://github.com/flavio-a-galvao/cinema-mobile/pull/8) integrado à main no [commit 9b460a4](https://github.com/flavio-a-galvao/cinema-mobile/commit/9b460a4200ff2991abefaf747c260413dcc5b5be), após revisão técnica assistida e autorização explícita do responsável, sem revisão humana independente. A árvore integrada é idêntica à validada no [CI da combinação 670c95f](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45710972344): testes/builds web e API, três testes de auditoria e [integração Docker real](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45710972344/job/139544975385) aprovados. Cinco serviços padrão; auditoria opcional como sexto serviço, SQLite no volume audit-data. Sem deploy de produção ou medição mensal de SLO. Os registros anteriores abaixo são históricos.

**Para a apresentação atual:** mostre o diretório `Projeto-auditoria/` na main e execute `docker compose up -d --build auditoria` na stack configurada. Para a prova isolada, use `node scripts/test-audit.mjs` com Node 24 e Docker. O PR #8 não é mais candidato; a revisão humana independente e a homologação final de entrega permanecem não comprovadas. O roteiro e os hashes históricos abaixo foram preservados como registro da conferência anterior.

Conferência em 24/11/2026, horário de São Paulo. Este registro separa código integrado, candidato a integração e resultados anteriores. A escala abaixo usa os 12 critérios A1–A5/B1–B4/T1–T3 transcritos no [relatório de avaliação](RELATORIO_FINAL_RUBRICA.md), sem atribuir nota. A cópia PDF encontrada em `referencias/` é a rubrica anterior de Mobile/Engenharia, com Tech Forge centrado em upload e papéis. Para confirmar pesos ou requisitos adicionais da etapa avançada, use a rubrica vigente da disciplina.

| Versão | O que mostrar | Evidência |
| --- | --- | --- |
| `main` `43380fe` | API, React, pôster substituto local do PR #7, bilheteria web corrigida pelo PR #10, Redis, observabilidade, Swagger, CI e Compose padrão | [SHA integrado](https://github.com/flavio-a-galvao/cinema-mobile/commit/43380fe32682d9b04de9f3db74617fc5bbfc6abc) · [CI da main](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45433562530) · [Evidência da bilheteria](https://github.com/flavio-a-galvao/cinema-mobile/blob/43380fe32682d9b04de9f3db74617fc5bbfc6abc/docs/evidencias/kan-26-correcao-web.md) |
| PR #8 `18a1aed` | Candidato com processo Node.js de auditoria no perfil opcional `audit` e SQLite. PR aberto, sem conflitos, CI aprovado, sem aprovação humana registrada | [PR](https://github.com/flavio-a-galvao/cinema-mobile/pull/8), [CI](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610), [prova Docker](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610/job/137508631835) |
| PR #9 | Documentação da entrega preparada para a main atual | [Diff documental](https://github.com/flavio-a-galvao/cinema-mobile/pull/9/files) |

## Cobertura da rubrica avançada

| Critério | O que está demonstrado e qual é o limite |
| --- | --- |
| A1 — Documentação arquitetural | [C4](arquitetura/README.md), seis ADRs retrospectivos e [cenários de qualidade](arquitetura/QUALITY_SCENARIOS.md). O nível de contêineres do candidato mostra o perfil `audit` e SQLite. Renderização local do candidato validada com Mermaid 12.3.0 e Chrome 158. [Contexto](evidencias/entrega-final/c4-contexto.png) e [Contêineres](evidencias/entrega-final/c4-containers.png). As [capturas anteriores](evidencias/auditoria/local.json) permanecem históricas; não houve teste da renderização no GitHub. |
| A2 — Estilos e DDD | [Context Map e modelo tático](arquitetura/DDD.md) documentam o backend monolítico de negócio. A auditoria consome metadados fora do fluxo transacional e não decompõe os contextos. |
| A3 — Integração, APIs e dados | [OpenAPI/Swagger](API_OPENAPI.md) com 52 operações e 34 caminhos na prova anterior, mais ADR MySQL/Sequelize. O consumidor do PR não abre HTTP e não altera a API. O ensaio visual anterior de Swagger não substitui um teste no Nginx real do ambiente de apresentação. |
| A4 — Qualidade, resiliência e observabilidade | [Logs, métricas e SLOs](OBSERVABILIDADE_RESILIENCIA.md) e [runbook](RUNBOOK_INCIDENTES.md). Há teste de correlação e fallback. As metas de 30 dias não são medição realizada, e os logs da auditoria não são métricas da API. |
| A5 — Entrega contínua | Testes e builds de web/API aprovados no SHA integrado. O deploy demonstrativo ficou `skipped`. O checkout em Chromium foi verificado localmente com API e MySQL descartável. [CI da main](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45433562530) · [Reprodução](CI_DEPLOY.md#playwright-execução-explícita) |
| B1 — Cache Redis | A [prova Docker anterior](evidencias/complementacao/resumo.json), base `d59723b`, registra miss/hit, TTL, invalidação e fallback. O job novo não re-testou toda a política de cache. |
| B2 — Mensageria Pub/Sub | A main publica e consome internamente seis tipos. No PR #8, o Docker demonstrou `filme.created` entre processos, deduplicação, persistência, disponibilidade da API durante a parada e nova assinatura após recriar o consumidor. Os seis tipos têm cobertura unitária no serviço novo. Não há replay de mensagens perdidas. |
| B3 — Docker e Nginx | O ensaio anterior verificou cinco serviços, MySQL, Redis e Nginx/HTTPS. O CI do PR verificou API, MySQL, Redis e auditoria reais, sem Nginx/HTTPS nessa execução. O perfil mantém a topologia padrão inalterada. |
| B4 — Boas práticas e observabilidade | Camadas existentes, erros tratados e logs sanitizados. No candidato, campos e canais são validados, SQL é parametrizado e a chave única evita duplicação. Volume SQLite precisa de backup e controle de espaço. |
| T1 — Jira | [KAN](https://cinemax-projeto.atlassian.net/jira/software/projects/KAN/boards/2) com 31 itens acadêmicos, 25 relações de pai e 42 dependências Blocks. Há rastreabilidade e histórico efetivo em KAN-12, KAN-18 e KAN-34, consolidados no [comentário de KAN-24](https://cinemax-projeto.atlassian.net/browse/KAN-24?focusedCommentId=10004). O [registro de gestão](gestao/JIRA_GUIA.md) distingue importação, trabalho, revisão e aceite. |
| T2 — Cynefin e abordagem | [Análise](gestao/CYNEFIN.md) fundamenta domínio complicado e abordagem híbrida com Kanban. |
| T3 — Ciclo de vida e entregas | [Plano](gestao/PLANEJAMENTO_AGIL.md), backlog priorizado, transições reais e [três snapshots de fontes com SHA-256](evidencias/complementacao/entregas.json). A consulta remota nesta conferência não retornou tags nem releases. Restam homologação, responsáveis/papéis confirmados e evidência de publicação se exigida na avaliação. |

## Roteiro de 5 a 7 minutos

1. **Arquitetura e contrato (1 min).** Mostre os cinco serviços padrão da `main` no C4 e abra o Swagger para ilustrar rotas públicas e protegidas. Na stack HTTPS configurada, acesse `https://cinema.local/api/api-docs/`. [C4](arquitetura/C4_CONTAINERS.md) · [Swagger](API_OPENAPI.md)
2. **Bilheteria web integrada (2 min).** Use uma sessão futura de teste e selecione B1. Emita o ingresso, saia antes de pagar, volte por **Minhas Compras** e recarregue o checkout. Demonstre Pix simulado, cancelamento com confirmação e liberação do assento. Mostre a prova de duas abas no relatório, com `201/409` e um pagamento por ingresso. [Evidência Chromium/MySQL](https://github.com/flavio-a-galvao/cinema-mobile/blob/43380fe32682d9b04de9f3db74617fc5bbfc6abc/docs/evidencias/kan-26-correcao-web.md)
3. **Auditoria candidata (1–2 min).** Mostre o C4 do PR #8 e o `eventId` recebido em processo separado e gravado no SQLite. Use o ensaio já preparado ou o log do runner para mostrar deduplicação, API disponível com o consumidor parado, recebimento de evento novo após reconexão e perda sem replay durante a desconexão. [Prova Docker do PR #8](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610/job/137508631835)
4. **CI e Jira (1–2 min).** Mostre o CI aprovado do SHA integrado e o comentário da KAN-26. Diferencie os 11 cenários Chromium anteriores, o checkout local com MySQL e os testes e builds do GitHub Actions. Abra a KAN-34 para mostrar a revisão pendente e a relação com o épico KAN-9. [CI da main](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45433562530) · [KAN-26](https://cinemax-projeto.atlassian.net/browse/KAN-26?focusedCommentId=10006) · [KAN-34](https://cinemax-projeto.atlassian.net/browse/KAN-34?focusedCommentId=10003)

Para preparar o ensaio do **PR #8**, use um clone ou worktree separado com Node.js 24, Docker Engine e Compose 2.24.4+.

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
- **O CI prova produção e SLO?** O CI da main cobre testes e builds de web/API. O checkout foi validado localmente em Chromium com API real e MySQL descartável. Deploy real e medição de 30 dias seguem sem evidência. [CI](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45433562530) · [Checkout](https://github.com/flavio-a-galvao/cinema-mobile/blob/43380fe32682d9b04de9f3db74617fc5bbfc6abc/docs/evidencias/kan-26-correcao-web.md)
- **O Jira foi só importado?** Não. Mostre o histórico real da KAN-34 e os vínculos com CI e PR. As minutas e comentários técnicos não equivalem ao aceite.

[Minutas e registros técnicos do Jira](gestao/ACEITES_TECNICOS.md) · [Notas e checklist da candidata](RELEASE_1.0.0-rc.1.md).

## Fechamento

- **Titular.** Revisar o PR documental, confirmar papéis em KAN-32 e decidir sobre a publicação da pré-release. A bilheteria já está integrada e tem evidência técnica em KAN-26, KAN-29 e KAN-30. O aceite formal segue condicionado às dependências do Jira. [Registros e dependências](gestao/ACEITES_TECNICOS.md#bilheteria--kan-29-kan-30-e-kan-26)
- **Colega.** Registrar a revisão humana do PR #8 quando disponível.
- **Após autorização do PR #8.** Conferir o SHA integrado e seu CI, reconciliar os diagramas e registrar as evidências na KAN-34. [Reconciliação do C4](arquitetura/C4_CONTAINERS.md#reconciliação-após-o-pr-8)
