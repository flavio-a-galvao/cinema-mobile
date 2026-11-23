# Auditoria independente do catálogo (KAN-34)

O protótipo local `836d891` usava `cinemax.audit.v1` e `film.created` e gravava apenas logs. Esta integração parte de `21c1904`, já com o PR #7 do catálogo, e reutiliza o publicador do backend e seu Subscriber interno.

| Canal | Eventos |
| --- | --- |
| `cinemax:eventos:filmes` | `filme.created`, `filme.updated`, `filme.deleted` |
| `cinemax:eventos:sessoes` | `sessao.created`, `sessao.updated`, `sessao.deleted` |

Cada mensagem aceita tem `eventId` UUID, `type` coerente com o canal, `id` inteiro positivo e `timestamp` ISO UTC canônico. O processo Node.js roda como usuário sem privilégios e assina os dois canais em conexão própria. Não abre porta HTTP nem acessa o MySQL.

Somente os campos validados são gravados em SQLite no volume `audit-data`. A chave primária `event_id` impede duplicação, inclusive após recriação do contêiner com o mesmo volume. Um UUID já gravado não sobrescreve o registro original. Payloads inválidos são descartados sem registrar seu conteúdo. Se a persistência falhar, o processo registra o erro e encerra para que o Compose tente reiniciá-lo.

**Limite:** a persistência registra apenas eventos recebidos e gravados. Redis Pub/Sub não oferece replay, confirmação de consumo ou entrega durável. Eventos publicados sem o consumidor conectado podem ser perdidos. Não há fila ou reprocessamento automático. O volume deve ser preservado e ter espaço monitorado, pois não há retenção automática. A rede Redis interna reduz exposição, mas a validação estrutural não autentica a origem de um evento.

## Execução e verificação

- A topologia padrão mantém os cinco serviços existentes. Em uma stack configurada, `docker compose up -d --build auditoria` inicia o consumidor e Redis. A API segue independente da auditoria. `docker compose logs auditoria` mostra assinatura, registros e duplicatas.
- Em Node.js 24, `npm --prefix Projeto-auditoria test` executa os testes da validação, persistência e idempotência.
- `node scripts/test-audit.mjs` verifica Docker, Redis e MySQL reais num projeto Compose descartável, usando o Compose principal com porta da API alocada automaticamente. O script correlaciona publicação e registro pelo `eventId`, testa duplicata e payload inválido, para e recria o consumidor, verifica os PIDs e consulta a tabela SQLite. A limpeza remove apenas recursos com nome aleatório da execução.
- O job de auditoria no GitHub Actions roda o ensaio Docker e imprime os resultados no log. A execução aprovada deve ser vinculada à [KAN-34](https://cinemax-projeto.atlassian.net/browse/KAN-34) com seu SHA. O ensaio real com Docker é distinto dos testes unitários do SQLite.

Veja os [contêineres C4](arquitetura/C4_CONTAINERS.md) e o [contrato Redis](REDIS_PUBSUB.md).
