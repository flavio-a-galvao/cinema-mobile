# Planejamento ágil e ciclo de vida

## Baseline, escopo e papéis

Plano proposto em 05/11/2026, base `c826368`. O trabalho técnico já existe em
grande parte; a fila organiza validação, evidências e pendências, sem estimar
retroativamente desenvolvimento ou inventar sprints. Escopo protegido:
`Projeto-mobile/`, funcionalidades e contratos existentes.

Não há lista de participantes/contas Jira confirmada nesta sessão. Os nomes
`Flavio Galvao` e `joaovitorpereira5` aparecem em metadados Author de commits
consultados; isso não comprova vínculo de conta Jira, responsabilidade atual ou
participação em reunião. Não serão convertidos automaticamente em assignees.

| Responsabilidade proposta | Atividade | Pessoa/conta |
| --- | --- | --- |
| Decisão de produto/backlog | Priorizar escopo e negociar aceite com a disciplina | A confirmar em TK06 |
| Execução técnica | Executar/corrigir itens, testes e evidências | Participante real que assumir o item |
| Revisão/aceite técnico | Conferir critérios e rastreabilidade, sem aprovar resultado não observado | A confirmar; se houver somente uma pessoa, registrar auto-revisão e sua limitação |
| Administração Jira | Validar acesso, esquema, importação e permissões | Administrador autorizado a identificar |
| Avaliação acadêmica | Avaliar entrega conforme rubrica | Avaliador da disciplina, sem nome presumido |

Papéis são responsabilidades, não afirmação de equipe Scrum formada. Não há
Scrum Master/Product Owner nomeado, divisão de trabalho individual ou aprovação
atribuída a pessoa sem confirmação. A atribuição futura deve corresponder a
conta real e acordo registrado.

## Kanban proposto

| Coluna | Política de entrada/saída | WIP inicial proposto |
| --- | --- | --- |
| To Do | Refinado, priorizado e com dependências/precondições identificadas | Fila ordenada; não puxar tudo simultaneamente |
| In Progress | Participante real assumiu o trabalho e começou sua execução | 1 item no quadro |
| In Review | Entrega/evidência disponível, critérios e revisão pendentes | 1 item no quadro |
| Done | Critérios e Definition of Done atendidos e aceite real registrado | Sem limite |

Os limites são hipótese conservadora enquanto capacidade não é conhecida; devem
ser revistos com participantes reais. Bloqueio usa flag/motivo/data, sem criar
coluna que esconda WIP. Revisão rejeitada volta para In Progress; item reaberto
mantém motivo e histórico real. Transições só ocorrem quando acontecerem.

Cadência sugerida: triagem a cada sessão de trabalho; revisão semanal de
prioridades/bloqueios; demonstração no fechamento de cada marco; retrospectiva
curta após a entrega. São atividades futuras, sem atas, participantes ou datas
fabricadas. Não há sprints, velocidade, burndown ou lead time histórico medidos.
Começar a medir trabalho em andamento, throughput, cycle time e tempo bloqueado
somente após adoção real; não derivar essas métricas de intervalos entre commits.

### Definition of Ready

Item possui benefício/objetivo, tipo, épico, prioridade, critério de aceite,
estimativa a revisar, fontes e dependências. Acesso/ambiente necessário deve estar
disponível ou o bloqueio explícito. Stories não incluem reconstruir código já
existente sem necessidade técnica.

### Definition of Done

1. Critérios objetivos verificados, com referência ao SHA e ambiente quando aplicável.
2. Evidência suficiente anexada/vinculada, distinguindo mocks, inspeção e serviço real.
3. Revisão registrada por pessoa real; documentação consistente e nenhum segredo exposto.
4. Mudança funcional, se houver em tarefa futura, passa nos testes/builds relevantes
   e atualiza contrato/documentação; item exclusivamente documental passa por links/diff.
5. `Projeto-mobile/` intacto e dados preservados; pendências impeditivas não escondidas.
6. Estado/resolução Jira atualizado somente após aceite efetivo. Commit existente
   ou CSV importado, isoladamente, não satisfazem Done.

## Ciclo de vida e marcos

| Etapa | Trabalho e saída esperada | Gate verificável |
| --- | --- | --- |
| Enquadramento | Cynefin, escopo e participantes; confirmar rubrica integral | Estratégia revisada e responsabilidades reais identificadas |
| Planejamento | Refinar backlog, conciliar Jira e dependências | TK06/TK01/US14 aceitos no serviço real |
| Execução incremental | Validar baseline US01–US13; corrigir apenas defeitos confirmados | Critérios/evidências por item; riscos reavaliados |
| Homologação | Infraestrutura isolada, navegador, concorrência e contratos | TK02/TK03/TK04 e US15 com resultados reais |
| Qualificação/entrega | Notas, escopo, pendências e versão candidata | Gate de release abaixo e aceite US16 |
| Operação/evolução | Coleta de SLIs, incidentes e correções compatíveis | Dados reais e backlog atualizado; TK05 permanece futuro |
| Encerramento/transição | Entregar fontes, instruções, acessos sob controle do titular e registro de pendências | Ciência de quem recebe, arquivos/evidências acessíveis; sem simular encerramento realizado |

Janelas de trabalho são relativas: primeiro habilitar gestão; depois validar
cadeias de acesso/administração/infraestrutura; por fim integrar e qualificar.
Use a ordem global e o grafo de dependências do [backlog](PRODUCT_BACKLOG.md).
Não há datas acordadas ou capacidade comprovada. Os 56 pontos são de validação,
sem velocidade histórica; as 21 h de Tasks/Bugs não incluem esperas/ambiente nem
30 dias corridos de observação. Esses números não autorizam uma promessa de prazo.

## Releases e versionamento semântico

### Situação comprovada

A consulta de tags locais e `origin` não retornou tags. A análise não inspecionou
GitHub Releases, publicação npm ou ambientes de produção. Portanto **nenhuma
release é comprovada aqui**. Os manifests declaram raiz/backend `1.0.0` e
frontend `0.1.0`; são metadados de pacotes distintos, não histórico de lançamento
do produto. Commits `67645c9` a `c826368` são incrementos verificados, sem nomes
de versão inferidos deles.

### Plano proposto, sem versões publicadas nesta etapa

| Versão do produto proposta | Conteúdo | Condições para qualificar |
| --- | --- | --- |
| `1.0.0-rc.1` | Baseline web/API, Redis, arquitetura, contratos, observabilidade e gestão organizada | US01–US15 e TK01/TK02/TK03/TK04/TK06 com aceite; execução CI e demonstração reais |
| `1.0.0` | Entrega acadêmica da baseline qualificada | US16, notas da versão e aceite real; tag/release em ação futura autorizada |
| `1.0.1` | Correções compatíveis BUG01/BUG02, se confirmadas no refinamento | Reprodução, correção e regressão; sem enfraquecer CSP nem alterar API |
| `1.1.0` | Capacidade adicional de coleta operacional TK05 | Coleta configurada e evidência da janela observada; não declarar SLO cumprido antes dos dados |

O contrato público de referência é o [OpenAPI](../API_OPENAPI.md), acrescido dos
comportamentos web documentados. A política proposta usa MAJOR para mudança
incompatível, MINOR para capacidade compatível e PATCH para correção compatível,
com sufixo de pré-release na candidata. A regra segue
[SemVer 2.0.0](https://semver.org/lang/pt-BR/). Mudança futura que quebre contrato
exige planejamento de versão maior, não simples PATCH.

Notas/artefato devem vincular versão a SHA exato e lista de itens realmente
aceitos. Package versions só serão alinhadas em trabalho futuro autorizado.
Tags e releases não são criadas por esta documentação, e Done de issue não
implica implantação. BUG01/BUG02 são P2: podem constar como limitações conhecidas
da candidata se o aceite real permitir; não é aprovação já dada. A coleta mensal
TK05 não bloqueia a baseline apenas porque o SLO ainda não foi medido, mas essa
limitação deve constar na entrega.

## Riscos e controle de mudança

| Risco observado | Resposta planejada |
| --- | --- |
| Acesso Jira indisponível | CSV/guia prontos; não simular uso; TK01/US14 pendentes |
| Ambiente do notebook diferente | Reproduzir instruções em projeto isolado e registrar erros reais |
| Evidência histórica confundida com validação atual | Exigir data/SHA/escopo em cada nova evidência |
| Pagamento/emissão duplicados em retentativa | Reconciliar estado e preservar restrições, conforme runbook |
| Prazos/capacidade desconhecidos | Refinar e reduzir WIP; não inventar calendário ou velocidade |
| Escopo crescer para módulo anterior | Manter proteção de Projeto-mobile/ e registrar demanda separada |

Demanda nova entra no backlog com impacto em critérios, dependências e release.
Não se reescreve histórico de commits, autores, sprints ou movimentações para
adequar o relato à rubrica.
