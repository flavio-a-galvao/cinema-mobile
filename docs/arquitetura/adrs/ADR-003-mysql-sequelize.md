# ADR-003 — Persistência relacional com MySQL e Sequelize

- **Status:** adotada no código; registro retrospectivo.
- **Data do registro:** 05/11/2026; base `e23bd86`.

## Contexto

Sessões referenciam filmes e salas; ingressos relacionam sessão, cliente e
assento; pagamentos referenciam ingressos. Emissão concorrente e pagamento
duplicado precisam de controles além da interface web.

## Decisão

Usar MySQL como fonte de verdade e Sequelize/mysql2 no backend. O dialect ativo
é `mysql`, independentemente de dependências de outros bancos ainda constarem no
manifesto. Os models representam tabelas e os controllers coordenam transações.

## Justificativa

O modelo relacional combina com as referências e consultas existentes. Transações,
bloqueios e índices únicos dão suporte à consistência. Sequelize fornece APIs de
model e transação utilizadas pelo código TypeScript. Essa é uma leitura técnica
da implementação, não evidência de um estudo comparativo da equipe.

### Detalhamento técnico retrospectivo

- MySQL permite combinar transações e bloqueios `FOR UPDATE` com índices únicos.
  A coluna gerada de ocupação ativa usa `NULL` para cancelados, permitindo manter
  histórico sem bloquear uma nova emissão para o mesmo lugar da sessão.
- `DECIMAL(6,2)` representa preços no armazenamento; o código calcula snapshots
  e meia-entrada em centavos antes de persistir. O driver pode retornar decimais
  como strings, diferença explicitada nos schemas da
  [API OpenAPI](../../API_OPENAPI.md).
- Sequelize centraliza configuração e APIs de models/transações. O adaptador
  efetivo é `mysql2`; usar ORM não torna portável o SQL específico de coluna
  gerada e `UPDATE ... JOIN` dos utilitários de evolução.
- A unicidade de pagamento é reforçada no banco, além da consulta no controller.
  A evolução verifica duplicidades antes de criar o índice e preserva valores
  legados desconhecidos, sem presumir tipo de ingresso.

Este complemento descreve mecanismos verificáveis nas fontes. Não atribui
decisões históricas, comparações de desempenho ou aprovações não registradas.

## Alternativas consideradas neste registro

- PostgreSQL: também atenderia ao modelo relacional; a troca exigiria rever SQL,
  drivers e particularidades dos ajustes de schema.
- SQL direto em toda a aplicação: daria controle explícito, com maior repetição
  de mapeamento; já existe SQL pontual para ajustes específicos.
- Banco documental: exigiria redefinir relações, consultas e controles de
  concorrência hoje baseados no banco relacional.

## Consequências

- Emissão em lote é uma transação: bloqueia a sessão, verifica propriedade,
  horário, sala e ocupação, e grava de 1 a 10 ingressos.
- Um índice único em `(id_sessao, id_assento, ocupacao_ativa)` restringe assentos
  ativos duplicados. A coluna gerada fica `NULL` para cancelados, preservando o
  histórico e permitindo nova ocupação.
- Pagamentos têm unicidade por `id_ingresso` e bloqueio do ingresso; valor vem
  do snapshot do ingresso. Isso é registro interno, sem liquidação bancária.
- O startup aplica utilitários de evolução e `sequelize.sync`. Não se deve
  apresentar esse mecanismo como um sistema completo de migrations versionadas.
- Alterações de schema e dados legados podem impedir a inicialização. O Compose
  persiste dados em volume, mas não implementa réplica ou backup automático.
- A conexão atual usa `ssl: false`. Produção e recuperação de desastre exigem
  decisões operacionais adicionais; não são resultados desta entrega.

## Rastreabilidade

[Conexão](../../../Projeto-back-end/src/config/database/index.ts),
[models](../../../Projeto-back-end/src/models),
[ingressos](../../../Projeto-back-end/src/controllers/ingressos.controller.ts),
[pagamentos](../../../Projeto-back-end/src/controllers/pagamentos.controller.ts),
[índice de ocupação](../../../Projeto-back-end/src/utils/ensureIngressosSchema.ts),
[evolução de preço/pagamento](../../../Projeto-back-end/src/utils/ensureTicketPaymentSchema.ts),
[startup](../../../Projeto-back-end/src/server.ts) e [DER](../../DER.md).
