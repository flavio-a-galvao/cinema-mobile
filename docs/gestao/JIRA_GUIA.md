# Jira — configuração, importação e evidências

## Situação real

Em 11/11/2026 o titular confirmou que **ainda não há projeto Jira configurado**,
URL, chave ou tipo de projeto. Não houve acesso a um projeto Jira. Nenhuma issue foi criada, atribuída,
movida, comentada ou marcada como concluída. O CSV é preparo local para futura
importação, não exportação de dados reais. Sugerir a integração não a conecta.

## Identificar o destino antes de escrever

Após habilitar a integração ou acessar o Jira autorizado, confirmar site, URL/key
e nome do projeto, contexto acadêmico, tipo de projeto e permissões. Não presumir
que a chave seja CINEMAX ou CMX: `CMX-*` nos resumos são **IDs locais**.
Consultar issues, épicos, usuários, workflow e versões existentes. Comparar
resumos e evidências com este backlog para evitar duplicação, preservando
autores, assignees e status reais. O nome do repositório, sozinho, não identifica
o projeto correto. Registrar as correspondências ID local → chave real somente
após confirmação.

Tipos propostos: Epic, Story, Task e Bug. Story/Task/Bug são filhos de Epic no
modelo preparado. Task relacionada a uma Story não é sua filha: usar associação
ou link de dependência. Para subtarefas futuras, usar o tipo próprio Sub-task;
o CSV atual não contém subtarefas nem exige níveis especiais de hierarquia.

## CSV preparado

[jira-import.csv](jira-import.csv): UTF-8, vírgula, aspas duplas com escape por
duplicação, descrições multilinha. **30 registros: 6 Epic, 16 Story, 6 Task, 2 Bug.**
Pais aparecem antes dos filhos e usam IDs numéricos únicos locais.

| Coluna | Mapeamento sugerido |
| --- | --- |
| Work item ID | Identificador numérico da importação; não é chave Jira já existente |
| Work type | Tipo Epic/Story/Task/Bug disponível no destino |
| Summary | Resumo com ID local estável para conciliação |
| Description | História/objetivo, critérios, estimativa proposta, fontes, dependências e versão proposta |
| Parent | ID numérico do épico pai da mesma importação |
| Priority | Highest/High/Medium, conciliando P0/P1/P2 com o esquema real |
| Status | To Do como proposta inicial, não histórico exportado |
| Labels | cinemax-gestao, para localizar o conjunto importado |

Não há Assignee/Reporter, datas, resolução, worklogs, sprint ou Fix Version.
Estimativas ficam na Description para não depender de campos personalizados:
depois de configurar o campo correto, o administrador pode transcrever pontos
das Stories e horas estimadas de Tasks/Bugs, sem preencher tempo realizado.
Versões descritas são propostas; não marcar versões como released.

No Jira Cloud, usar a experiência de importação que mapeia IDs/Parent/tipos,
evitando o importador simplificado de criação em massa que não preserva
essa hierarquia. Conferir opções/permissões da instância na
[documentação do importador](https://support.atlassian.com/jira-software-cloud/docs/create-issues-using-the-csv-importer/).
O [guia de hierarquia](https://support.atlassian.com/jira/kb/keep-issue-parent-child-mapping-during-csv-import-to-jira-cloud/)
orienta IDs de pai e ordem das linhas em projetos company-managed. Se o destino
for outro tipo/Data Center, adaptar e validar o mapeamento antes de importar;
não se afirma compatibilidade universal com configuração desconhecida.

### Procedimento de importação a executar

1. Conciliar com issues reais. Se já existirem, retirar duplicatas do lote e
   ajustar referências em uma cópia; preservar este CSV como proposta original.
2. Usar **Settings → System → External System Import → CSV**, selecionando o
   projeto confirmado, UTF-8 e vírgula. Para team-managed sem admin, verificar
   **Spaces → Create space → Import data** e as permissões efetivas da conta.
3. Mapear as colunas, inclusive IDs/Parent e tipos. Configurar To Do e prioridades
   reais antes; o nome de campo pode variar com idioma/experiência da instância.
4. Validar uma cópia de amostra Epic/Story/Task/Bug num espaço separado autorizado
   para teste, com seus pais presentes. Conferir resultado/Parent. O espaço de
   teste não é o destino final, e suas chaves não podem ser reutilizadas ali.
5. Após conciliação, importar o lote final uma única vez no destino e registrar IDs → chaves.
   Confira responsáveis/relator aplicados por padrão; a omissão de Assignee no
   arquivo não impede atribuição automática do projeto. Não criar contas fictícias.
6. Vincular dependências descritas usando as chaves reais. Description não cria
   links `blocks/is blocked by`; essa etapa é manual/autorizada após importação.

O mapeamento e a validação seguem o
[procedimento oficial de CSV](https://support.atlassian.com/jira-cloud-administration/docs/import-data-from-a-csv-file/).
Se Parent não estiver disponível, não improvisar Epic Link sem conferir o modelo.
Importar sem pais e vinculá-los manualmente só é alternativa após confirmação
do administrador; mantenha registro da conciliação. O arquivo não contém chaves
reais, portanto reimportá-lo pode duplicar issues. Não o use como atualização
idempotente de projeto existente.

### Validação local e diferenças no Jira Cloud (11/11/2026)

Execute na raiz: `powershell -ExecutionPolicy Bypass -File scripts/validate-jira-csv.ps1`.
O [resultado](../evidencias/complementacao/jira-csv.json) verifica UTF-8, cabeçalhos,
30 registros (6/16/6/2), campos locais obrigatórios, IDs únicos, Summary até 255
caracteres, épicos anteriores aos filhos, prioridades e consistência com a fila
do backlog. As 42 dependências existem e não formam ciclos. Não valida o esquema
de um Jira inexistente. Summary é obrigatório no importador; outros campos
obrigatórios dependem da configuração real e precisam ser preenchidos antes da
importação, sem criar pessoas ou datas fictícias.

| Destino | Preparação e conferência |
| --- | --- |
| Cloud company-managed | Administrador de site/organização; conferir esquemas e campos. Mapear Work item ID (Issue ID na experiência antiga), Parent e tipos. A orientação de hierarquia da Atlassian para esse modelo exige pais antes dos filhos. |
| Cloud team-managed | Tipos e campos pertencem ao projeto; criar/conferir Epic, Story, Task e Bug e suas configurações antes. A importação atual em projeto existente admite usuários sem admin conforme permissões. Mapear a hierarquia e testar Parent; não transportar IDs de tipos/esquemas company-managed nem assumir Epic Link. |

Em ambos: conciliar Highest/High/Medium e To Do com valores existentes; conferir
campos adicionais na validação do importador. Task/Bug continuam no nível de
Story, com Epic como Parent. **Parent não cria links de bloqueio**: após importar,
converter cada dependência local em `is blocked by` pela chave real (o pré-requisito
`blocks` o dependente). Não usar a ordem das linhas como ordem de execução: ela
preserva a hierarquia, enquanto a fila do backlog respeita dependências.

Se Parent não for preservado, interromper o lote final e corrigir o mapeamento
no espaço de teste. Vinculação manual de filhos já importados exige autorização
e conferência, sem reimportar/duplicar as 30 issues. Guardar relatório de importação,
contagens 6/16/6/2, pais de todos os 24 filhos e correspondências reais; depois
atribuir contas reais e registrar somente os movimentos/aceites ocorridos.

Fontes oficiais consultadas em 11/11/2026:
[preparo e hierarquia](https://support.atlassian.com/jira-software-cloud/docs/prepare-a-csv-file-for-import/),
[importação em company/team-managed](https://support.atlassian.com/jira-software-cloud/docs/import-issues-into-an-existing-space-in-jira-using-csv/),
[hierarquia company-managed](https://support.atlassian.com/jira/kb/keep-issue-parent-child-mapping-during-csv-import-to-jira-cloud/).

## Workflow e responsabilidade

Workflow sugerido: **To Do → In Progress → In Review → Done**, com retornos
justificados. Categorias propostas: To Do / In Progress / In Progress / Done.
Configurar resolução somente ao aceitar Done e removê-la na reabertura conforme
as regras do projeto. WIP e critérios estão no [planejamento](PLANEJAMENTO_AGIL.md).
Não alterar workflow global ou movimentar issues antigas para encaixar a proposta
sem analisar o impacto. Pessoas e permissões devem ser confirmadas em TK06.

Todos os itens em To Do no CSV sinalizam aceite/conciliação pendentes; isso não apaga a implementação
existente. Depois de verificar os critérios e fontes, registrar o aceite atual
e mover os itens que realmente o satisfizerem, sem datas retroativas ou falsas
etapas intermediárias. Não reconstruir uma sprint passada a partir de commits.

## Roteiro de evidências a produzir no Jira

| Evidência futura | Demonstração necessária | Estado nesta entrega |
| --- | --- | --- |
| Projeto correto | URL/key e configuração de tipos/workflow, sem expor dados de outras turmas | Não coletada |
| Backlog priorizado | Épicos/Stories, critérios, estimativas propostas e responsáveis confirmados | CSV/documentação locais; sem tela Jira |
| Hierarquia e links | Abrir Story/Task/Bug e mostrar Epic pai e dependências reais | Não configurados no serviço |
| Quadro | Quatro colunas e WIP; um item em execução/revisão só quando houver trabalho real | Workflow proposto |
| Rastreabilidade | Issue real → commit verificado → teste/documento/evidência identificada | Commits/fontes locais disponíveis; vínculo Jira pendente |
| Aceite/histórico | Critérios verificados, revisão e transições que de fato ocorreram | Não há histórico Jira comprovado |
| Release | Versão proposta vs released e SHA/nota quando houver publicação real | Não há release comprovada |

Nas futuras capturas, incluir data, URL/key e contexto legível; omitir tokens,
senhas e dados pessoais. Não produzir screenshots simulados. Guardar um índice
com ID local, chave real, URL, evidência e data quando coletado; não criar agora
URLs, chaves ou responsáveis de exemplo que pareçam registros reais.

## Critério de conclusão no serviço externo

Concluir US14 apenas após identificar o projeto, conciliar/importar itens,
conferir hierarquia/permissões e produzir evidências reais. A preparação desta
entrega atende ao caminho alternativo sem integração, mas a demonstração de uso
do Jira permanece pendente. Nenhuma instalação de dependência ou alteração em
código é necessária para preparar esse material.
