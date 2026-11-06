# Tech Forge — gestão do Cinemax

Levantamento de **05/11/2026**, base `c826368` na `main`, inicialmente limpa e
sincronizada com a referência remota consultada. Esta entrega é documental:
não altera aplicação, contratos da API ou `Projeto-mobile/`.

## Mapa dos critérios informados

| Critério | Documento/artefato | O que avaliar |
| --- | --- | --- |
| Framework Cynefin e escolha da abordagem | [CYNEFIN.md](CYNEFIN.md) | Domínio predominante, exemplos e comparação de abordagens |
| Product Backlog e User Stories | [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) | 6 épicos, 16 Stories, 6 Tasks e 2 Bugs; critérios de aceite, prioridades, estimativas e dependências |
| Fluxo ágil, papéis e ciclo de vida | [PLANEJAMENTO_AGIL.md](PLANEJAMENTO_AGIL.md) | Kanban proposto, WIP, responsabilidades a confirmar, etapas e gates |
| Planejamento de releases/SemVer | [PLANEJAMENTO_AGIL.md](PLANEJAMENTO_AGIL.md) | Versões propostas e distinção de release comprovada |
| Organização/importação Jira | [JIRA_GUIA.md](JIRA_GUIA.md), [jira-import.csv](jira-import.csv) | Identificação do projeto, mapeamento, hierarquia e preservação do histórico |
| Evidências da gestão | [Roteiro Jira](JIRA_GUIA.md) | Capturas/URLs ainda a produzir, sem movimentos fictícios |
| Correspondência com implementação | [Backlog](PRODUCT_BACKLOG.md) | Commits verificados no histórico e fontes reais por história |

O mapa cobre os requisitos descritos no pedido. A rubrica integral da instituição
não foi fornecida; exigências adicionais de formulário ou apresentação precisam
ser conferidas com o avaliador.

## Estado real e limites

- **Jira:** plugin Atlassian localizado, mas não instalado/conectado nesta sessão.
  Nenhum projeto, usuário, issue, sprint ou workflow Jira foi consultado/alterado.
  A sugestão de integração não constitui autorização/conexão concluída.
- **CSV preparado:** 30 registros para futura conciliação/importação. Todos com
  `To Do` proposto; sem Assignee, Reporter, datas, worklogs ou chaves Jira.
- **Implementação observada:** US01–US13 têm fontes/commits existentes. Isso não
  comprova aceite no Jira, execução de sprint ou conclusão de cada validação.
- **Propostas:** US14–US16, Tasks, tratamento dos Bugs e versões futuras. Os
  Bugs são achados estáticos documentados, sem correção/reprodução visual alegada.
- **Releases:** nenhuma tag local ou remota foi encontrada na consulta. Não há
  lançamento comprovado por esta análise; GitHub Releases não foi inspecionado.
  Versões em `package.json` não são evidência de publicação.

Validações desta etapa: links locais, CSV, hierarquia, contagens, critérios de
aceite, prioridades, dependências sem ciclos, correspondência dos commits com
`main`, escopo do diff e integridade do módulo anterior. Não houve instalação
de dependências, Docker ou execução de testes de código.

A conferência documental verificou 30 registros CSV, correspondência dos 64
critérios de aceite, 94 links locais e 16 commits ancestrais de `main`. Isso
valida a consistência do planejamento, sem declarar os critérios funcionais
executados ou aceitos no Jira.

## Fontes técnicas e pendências

As evidências técnicas existentes incluem [integração Redis](../evidencias/redis-infra.json),
[observabilidade local](../evidencias/observabilidade-local.json),
[OpenAPI](../API_OPENAPI.md), [arquitetura](../arquitetura/README.md) e
[CI/deploy](../CI_DEPLOY.md). São fontes históricas, não evidências de gestão Jira.

Para concluir a demonstração Tech Forge no serviço externo: habilitar acesso
Atlassian/Jira, identificar o projeto real, confirmar participantes e papéis,
conciliar itens existentes, importar/verificar a amostra e registrar a execução
real do fluxo. Replanejar após conhecer capacidade e data de entrega; nenhuma
sprint, velocidade ou aprovação da equipe foi presumida.
