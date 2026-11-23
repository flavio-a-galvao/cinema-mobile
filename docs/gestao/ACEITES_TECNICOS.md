# Minutas de aceite técnico — Cinemax

Conferência em 23/11/2026, com `main` em `21c1904`. Os textos abaixo são propostas para o titular revisar e publicar somente depois de confirmar o escopo aceito. Esta conferência não registra aceite, não altera status e não substitui a revisão humana do PR #8.

## KAN-12 — Catálogo público

| Critério | Evidência e limite |
| --- | --- |
| 1. GET sem JWT; detalhe 200/404 | O ensaio anterior com MySQL 9.1 descartável registrou listas públicas de filmes e sessões e detalhes 200/404. |
| 2. Lista em array e paginação `data`/`pagination` | A mesma prova conferiu os dois formatos e os metadados. O PR #7 não mudou API nem MySQL. |
| 3. Pôster preserva a origem do catálogo e falhas ficam registradas | O [registro antes/depois](../evidencias/kan-12-poster.md) preserva o 403 do Imgur. O Chrome validou pôster válido e SVG local para ausência, URL malformada, 404 e 403 com respostas locais controladas. O squash `21c1904` corresponde à árvore do PR revisado. Não houve repetição com MySQL na fase da correção. |

**Decisão sugerida:** os três critérios têm evidência técnica complementar. O titular pode aceitar esse escopo sem declarar um E2E novo com navegador e MySQL no mesmo ensaio.

**Minuta para o titular, após conferência:** “Conferi os critérios da KAN-12. Aceito a validação do catálogo público com as 12 verificações HTTP em MySQL descartável e, separadamente, a correção do pôster confirmada no Chrome com respostas controladas. A correção está na main 21c1904 e o CI 45118101224 está verde. O E2E completo não foi considerado executado.”

## KAN-18 — Pipeline

| Critério | Evidência e limite |
| --- | --- |
| 1. GitHub Actions real com SHA, testes e builds de ambos os módulos | [Run 43126457074](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/43126457074) em `6627173` e [run 45118101224](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45118101224) em `21c1904`, ambos com testes/builds de backend e frontend aprovados. |
| 2. Falhas sinalizadas, E2E corretamente separado | O [workflow](../../.github/workflows/ci.yml) não ignora falhas e o job demonstrativo depende de `validate`. A consulta de execuções retornou zero falhas do workflow. Está comprovada a configuração, sem amostra de execução negativa. O E2E integral não faz parte desses checks. |
| 3. Deploy-demo identificado como demonstração | O job é manual e não publica a aplicação. O resultado da main foi `skipped`. |

**Decisão sugerida:** o titular pode aceitar a configuração e o pipeline positivo. Se o critério 2 exigir demonstração observada de falha, ele fica parcial até uma prova negativa isolada e identificada como teste, sem fabricar falha de produção ou prejudicar os checks da main.

**Minuta parcial, após conferência:** “Conferi o CI dos commits 6627173 e 21c1904. Aceito a evidência de testes e builds aprovados e a separação do deploy demonstrativo, pulado nessas execuções. A sinalização de falha foi conferida no workflow, sem execução com erro registrada. E2E integral não foi executado no pipeline.”

## KAN-24 — Gestão rastreável no Jira

| Critério | Evidência e limite |
| --- | --- |
| 1. Projeto identificado, acesso autorizado e conciliação | [Cinemax KAN](https://cinemax-projeto.atlassian.net/jira/software/projects/KAN/boards/2), team-managed. Leitura, criação e edição foram conferidas. KAN-1, KAN-2 e KAN-3 foram vistos antes da criação e preservados. |
| 2. Seis épicos e 24 filhos conciliados, com chaves reais | O lote original de 30 foi conferido com 24 relações de pai e 42 Blocks. A Story KAN-34, adicionada posteriormente, totaliza 31 itens e 25 relações de pai. IDs `CMX-*` permanecem nos resumos; não foram atribuídos responsáveis presumidos. |
| 3. Quadro, permissões e evidência real | O quadro tem as quatro colunas e os [históricos conferidos](JIRA_GUIA.md#estado-conferido-em-23112026) mostram movimentos reais. Criação, vinculação e transição foram efetivamente executadas; não se atribuem tais permissões aos demais participantes. |

**Decisão sugerida:** o titular pode aceitar uso do Jira, backlog e rastreabilidade como evidência. O fechamento da Story ainda deve respeitar KAN-27 e a confirmação de papéis de KAN-32. O [comentário já registrado](https://cinemax-projeto.atlassian.net/browse/KAN-24?focusedCommentId=10004) documenta as observações sem aceite.

**Minuta de aceite parcial, após conferência:** “Conferi o projeto KAN, a conciliação de 30 itens originais, a hierarquia, as dependências e o uso efetivo do Kanban. Aceito as evidências de implantação e rastreabilidade. A confirmação de participantes e papéis e o aceite de fechamento continuam pendentes.”

Links: [KAN-12](https://cinemax-projeto.atlassian.net/browse/KAN-12), [KAN-18](https://cinemax-projeto.atlassian.net/browse/KAN-18), [KAN-24](https://cinemax-projeto.atlassian.net/browse/KAN-24).
