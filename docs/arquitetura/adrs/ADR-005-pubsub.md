# ADR-005 — Eventos operacionais de catálogo por Redis Pub/Sub

- **Status:** adotada no código; registro retrospectivo.
- **Data do registro:** 05/11/2026; base `e23bd86`.

## Contexto

A implementação registra circulação de eventos sobre alterações de filmes e
sessões. Esse acompanhamento deve falhar sem desfazer uma mutação já persistida
no banco. Não é um fluxo de pagamento nem uma fila de trabalho durável.

## Decisão

Publicar `filme.created/updated/deleted` e `sessao.created/updated/deleted` nos
canais `cinemax:eventos:filmes` e `cinemax:eventos:sessoes`. O envelope contém
`eventId`, `type`, `id` e `timestamp`, sem corpo da requisição ou dados pessoais.

O consumidor executa no backend: valida JSON, canal, tipo, identificador e data,
seleciona os campos permitidos e registra `consumed` em log. Há conexões próprias
de publicação e assinatura, separadas da conexão do cache. Redis não bloqueia a
abertura do servidor HTTP.

## Justificativa

Reutilizar a infraestrutura Redis permite demonstrar mensageria e correlacionar
publicação/consumo por `eventId`, sem introduzir outro broker. A simplicidade
serve ao consumidor operacional atual. Trata-se de justificativa retrospectiva,
sem atribuir à equipe uma avaliação histórica não registrada.

## Alternativas consideradas neste registro

- Log direto: suficiente para registro local, sem circulação por broker.
- Redis Streams ou broker com confirmação: úteis para retenção e replay,
  exigindo tratamento de pendências e consumidores idempotentes.
- Outbox transacional: aproximaria persistência de negócio e intenção de evento,
  exigindo tabela, publicador e acompanhamento de entrega.

## Consequências

- Publicação ocorre depois da persistência e da invalidação do cache; no update
  de sessão, depois do retorno bem-sucedido da transação. Falha de publicação
  retorna `false` e gera aviso, sem reverter MySQL.
- Não há outbox, retenção, replay, confirmação de processamento ou garantia de
  entrega durante indisponibilidade. Reconectar restaura assinaturas para
  mensagens futuras; não recupera mensagens perdidas.
- Cada processo assinante recebe os eventos publicados enquanto conectado;
  isso é fan-out, não grupo de consumidores de uma fila de trabalho.
- O Redis do Compose desativa persistência; logs operacionais não constituem
  trilha de auditoria financeira durável.
- Não existe consumidor que envie notificações, atualize a UI em tempo real ou
  sincronize Bounded Contexts de negócio.

## Rastreabilidade

[Serviço](../../../Projeto-back-end/src/services/catalogEvents.ts),
[inicialização](../../../Projeto-back-end/src/server.ts),
[testes de publicação](../../../Projeto-back-end/tests/pubsub.controllers.test.ts),
[testes de política](../../../Projeto-back-end/tests/pubsub.test.ts),
[operação](../../REDIS_PUBSUB.md) e
[evidência histórica](../../evidencias/redis-infra.json).
