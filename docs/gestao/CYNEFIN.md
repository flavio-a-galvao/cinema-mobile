# Análise Cynefin — Cinemax

## Classificação e alcance

**Domínio predominante: complicado**, no estado técnico atual. É uma conclusão
analítica desta documentação, não diagnóstico aprovado em workshop da equipe.
O Cynefin orienta decisões conforme o contexto; não é escala de quantidade de
tecnologias ou sinônimo de dificuldade. Sua distinção entre contextos é descrita
pela [The Cynefin Company](https://thecynefin.co/about-us/about-cynefin-framework/).

Como orientação de decisão: no claro, perceber/classificar/responder; no
complicado, perceber/analisar/responder; no complexo, sondar/perceber/responder;
no caótico, agir/perceber/responder. Quando não se sabe qual contexto predomina,
é preciso separar situações e reunir evidência antes de impor uma solução única.

Há componentes conhecidos, regras explícitas e relações de causa/efeito que
podem ser investigadas por análise especializada, testes e inspeção. O ciclo
principal — autenticar, consultar, emitir, pagar e cancelar — já existe. Ainda
há incerteza de homologação e avaliação; isso exige feedback e evidência, sem
tornar automaticamente todo o projeto um sistema complexo emergente.

## Exemplos concretos

| Contexto | Evidência real | Leitura Cynefin e ação adequada |
| --- | --- | --- |
| Concorrência de ingressos/pagamentos | `cbb1a6e`, `58dda76`; transação, locks e unicidade | Complicado: analisar invariantes e validar chamadas concorrentes no MySQL; bugs de concorrência não provam caos |
| Cache e Pub/Sub | `8893d86`, `5c6a580`, `e23bd86`; timeout, TTL, fallback e correlação de eventos | Complicado: analisar diferença entre cache, fonte de verdade e entrega best-effort; repetir ensaio controlado |
| Compose, TLS e Nginx | `e23bd86`; hosts, certificados, redes e volumes | Complicado: diagnóstico de configuração e dependências, sem remover dados ou TLS para contornar falha |
| Repetir validação documental/CI | Links, OpenAPI e workflow versionados | Claro no procedimento conhecido: aplicar checklist e observar o resultado real |
| Aceitação da interface e da apresentação | E2E e visualização ainda pendentes; sem pesquisa com usuários registrada | Pode envolver contexto complexo: experimentar uma demonstração pequena, colher feedback real e adaptar; não inventar entrevista |
| Incidente futuro com serviço fora do ar | Runbook existente; não há incidente real relatado nesta etapa | Pode exigir ação imediata se houver caos operacional; primeiro estabilizar e depois investigar. Não classificar o projeto atual como caótico |

A distinção entre análise no complicado e experimentação no complexo também é
tratada no artigo de Kurtz/Snowden,
[The new dynamics of strategy](https://thecynefin.co/wp-content/uploads/2026/02/Sense-making-in-a-complex-and-complicated-world.pdf).
As classificações dos exemplos acima são inferências aplicadas ao código local.

Fontes do projeto: [ingressos](../../Projeto-back-end/src/controllers/ingressos.controller.ts),
[pagamentos](../../Projeto-back-end/src/controllers/pagamentos.controller.ts),
[cache](../../Projeto-back-end/src/services/catalogCache.ts),
[eventos](../../Projeto-back-end/src/services/catalogEvents.ts),
[infraestrutura](../INFRAESTRUTURA_DOCKER.md),
[cenários de qualidade](../arquitetura/QUALITY_SCENARIOS.md) e
[runbook](../RUNBOOK_INCIDENTES.md).

## Comparação das abordagens

| Abordagem | Utilidade no Cinemax | Limite |
| --- | --- | --- |
| Preditiva | Fixar entregáveis da disciplina, escopo protegido e critérios de aceite | Cronograma detalhado antecipado não elimina incerteza de ambiente, acesso Jira e homologação |
| Ágil | Priorizar riscos, validar incrementos pequenos e adaptar com feedback | Sem marcos explícitos, pode deixar evidências e itens da rubrica para o final |
| Híbrida | Combinar marcos acadêmicos com execução incremental e revisão do backlog | Exige separar planejamento de resultados e não simular cerimônias/sprints passadas |

**Escolha: abordagem híbrida, com execução ágil por Kanban.** Os marcos são
preparação, validação integrada e qualificação da entrega. Dentro deles, trabalho
puxado, WIP reduzido, critérios verificáveis e revisão do backlog permitem lidar
com dependências e bloqueios reais. Isso é uma proposta de adoção a partir desta
etapa, não afirmação de que um quadro já foi usado.

Não se adota um plano predominantemente preditivo: há pendências que dependem de
experimento/feedback e acesso externo. Por isso, os artefatos principais são
backlog, fluxo e releases; não foi criado PM Canvas como se essa alternativa
tivesse sido escolhida. Caso o avaliador exija Canvas independentemente da
abordagem, ele deverá ser confirmado e preparado separadamente.

## Como revisar a decisão

Reavaliar no refinamento se surgir regra nova, falha não reproduzível ou feedback
que invalide uma hipótese. Registrar o sinal observado, escolher análise técnica
ou experimento pequeno, e atualizar o backlog após o resultado. Sem crise real,
não declarar domínio caótico. Sem validação com usuários, não afirmar que a
experiência já foi aprovada. O [planejamento](PLANEJAMENTO_AGIL.md) operacionaliza
a escolha, preservando o módulo mobile anterior.
