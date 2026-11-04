# Mensageria e assinatura de eventos — Redis Pub/Sub

## Arquitetura e execução

`src/services/catalogEvents.ts` concentra publicação, validação e consumo do
catálogo. Reutiliza o pacote `redis` e `REDIS_URL` do cache, sem nova dependência
ou serviço de infraestrutura. São sockets separados:

- Cache: conexão existente para `GET`/`SET`.
- Publisher: publica mensagens JSON com `PUBLISH`.
- Subscriber: criado com `publisher.duplicate()`, dedicado a `SUBSCRIBE`.

O entrypoint `src/server.ts` inicia o serviço uma única vez, sem aguardar Redis
para disponibilizar HTTP. O subscriber assina os dois canais em uma chamada.
Chamadas repetidas de `start()` não adicionam conexões nem listeners. O cliente
Redis restaura as assinaturas após reconectar; uma assinatura inicial que falhar
é tentada novamente, sem executar múltiplas tentativas simultâneas.

O consumidor real roda dentro de cada processo backend. Valida canal, tipo,
identificador, UUID e timestamp; descarta mensagens inválidas e processa as válidas
como registros de auditoria operacional em JSON no console. Não atualiza o banco
nem republica mensagens, evitando ciclos. Cada instância assinante recebe sua
própria cópia: Pub/Sub não distribui trabalho entre consumidores como uma fila.

## Canais e eventos

| Canal | Tipos |
| --- | --- |
| `cinemax:eventos:filmes` | `filme.created`, `filme.updated`, `filme.deleted` |
| `cinemax:eventos:sessoes` | `sessao.created`, `sessao.updated`, `sessao.deleted` |

Payload padronizado:

```json
{
  "eventId": "123e4567-e89b-42d3-a456-426614174000",
  "type": "filme.updated",
  "id": 7,
  "timestamp": "2026-11-03T12:00:00.000Z"
}
```

`eventId` identifica a ocorrência; `id` identifica o filme ou sessão. O timestamp
é UTC ISO 8601. Não são enviados corpos de requisição, credenciais, dados pessoais
ou informações de pagamento. Os logs de consumo também filtram campos extras.

Os controllers publicam depois da persistência e da invalidação do cache. No
update transacional de sessões, a publicação fica **após o commit**. Validação
rejeitada, 404, conflito de exclusão, falha de banco ou rollback não publicam.
As rotas administrativas existentes usam os mesmos controllers. Upload de pôster
também gera `filme.updated`, após salvar a associação. Contratos HTTP preservados.

## Falhas, entrega e encerramento

Sem `REDIS_URL`, mensageria fica desativada. Com URL, os clientes reconectam com
intervalo crescente de 250 ms até 5 s e timeout de conexão de 500 ms. A fila
offline é desativada. Se o publisher não estiver pronto, a publicação é descartada
e a API segue normalmente; `PUBLISH` tem timeout de 500 ms e falhas não propagam
para os controllers. Avisos estruturados são limitados a um por categoria/conexão
a cada 5 s, sem registrar detalhes que possam conter segredos.

Redis Pub/Sub oferece entrega **no máximo uma vez**, sem persistência, replay,
ack de processamento ou retentativa de publicação. `published` significa que
Redis aceitou `PUBLISH`; `subscribers` informa conexões destinatárias, não confirma
processamento. É possível publicar com zero assinantes. O log `consumed` demonstra
que aquele consumidor processou a mensagem. Durante desconexões ou na janela
entre commit do banco e publicação, eventos podem ser perdidos. Essa mensageria
é observacional; a correção do CRUD e a invalidação do cache não dependem dela.
Não representa auditoria durável nem substitui outbox/filas para entrega garantida.

Em `SIGTERM`/`SIGINT`, o servidor deixa de aceitar novas requisições e drena as
existentes; depois encerra Pub/Sub, cache e banco. `stop()` é idempotente e destrói
os sockets Redis, cancelando reconexões, assinaturas e timers de retentativa.
Um limite de 10 s impede que o encerramento fique preso indefinidamente.

Pub/Sub é global ao servidor Redis: bancos lógicos diferentes não isolam canais.
Use instâncias Redis separadas entre ambientes. O Compose já mantém Redis em rede
interna, sem porta publicada. Não houve necessidade de mudar o manifesto.

## Demonstração com Docker Compose (PowerShell)

Pré-requisitos: daemon Docker ativo, `.env` configurado conforme `.env.example`,
banco com as credenciais corretas e uma conta administrativa. O cache e Pub/Sub
usam `REDIS_URL=redis://redis:6379`. Execute na raiz:

```powershell
docker compose --env-file .env.example config --no-env-resolution --quiet
docker compose up -d --build redis database backend
docker compose exec redis redis-cli PING
docker compose logs -f backend
```

Espere `connection_ready` para publisher/subscriber e `subscribed` nos logs.
Em outro terminal, acompanhe mensagens diretamente no Redis:

```powershell
docker compose exec redis redis-cli SUBSCRIBE cinemax:eventos:filmes cinemax:eventos:sessoes
```

Com o token de login administrativo em `$env:ADMIN_TOKEN`, faça o CRUD em um
terceiro terminal (somente dados de demonstração):

```powershell
$api = 'http://localhost:3000'
$headers = @{ Authorization = "Bearer $env:ADMIN_TOKEN" }
$movie = Invoke-RestMethod "$api/filmes" -Method Post -Headers $headers -ContentType 'application/json' -Body '{"titulo":"Demo PubSub"}'
$id = $movie.id_filme
Invoke-RestMethod "$api/filmes/$id" -Method Put -Headers $headers -ContentType 'application/json' -Body '{"titulo":"Demo PubSub atualizado"}'
Invoke-RestMethod "$api/filmes/$id" -Method Delete -Headers $headers
```

Observe `filme.created`, `filme.updated` e `filme.deleted` no assinante CLI e logs
`published`/`consumed` no backend, correlacionando o mesmo `eventId`, tipo e ID.
Pelo painel administrativo, crie, edite e exclua uma sessão futura com filme e
sala válidos para demonstrar os três eventos de sessão. Faça upload de pôster
para observar mais um evento `filme.updated`.

Para filtrar os registros já gerados:

```powershell
docker compose logs --no-color backend | Select-String '"component":"redis_pubsub"'
docker compose exec redis redis-cli PUBSUB NUMSUB cinemax:eventos:filmes cinemax:eventos:sessoes
```

Exemplo de log de consumo esperado (ilustrativo, não evidência de execução):

```json
{"component":"redis_pubsub","level":"info","action":"consumed","channel":"cinemax:eventos:filmes","eventId":"123e4567-e89b-42d3-a456-426614174000","type":"filme.updated","id":7,"timestamp":"2026-11-03T12:00:00.000Z"}
```

Para demonstrar o consumidor isoladamente, publique uma mensagem manual válida.
Isso somente gera um log; não modifica um filme:

```powershell
$event = @{ eventId = [guid]::NewGuid().ToString(); type = 'filme.updated'; id = 1; timestamp = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ') } | ConvertTo-Json -Compress
$event | docker compose exec -T redis redis-cli -x PUBLISH cinemax:eventos:filmes
```

Para demonstrar indisponibilidade, pare Redis, faça uma edição válida pelo painel
e confirme o sucesso HTTP e os avisos. Reinicie Redis, aguarde as reconexões e faça
outra edição para observar novos eventos. A mensagem perdida não será reenviada:

```powershell
docker compose stop redis
docker compose logs --tail 50 backend
docker compose start redis
docker compose logs -f backend
```

## Validação e evidências disponíveis

```powershell
npm run validate:push
npm --prefix Projeto-back-end run build
docker compose --env-file .env.example config --no-env-resolution --quiet
# Apenas os testes novos de mensageria:
npm --prefix Projeto-back-end test -- tests/pubsub.test.ts tests/pubsub.controllers.test.ts
```

Testes automatizados cobrem os seis eventos, payloads, publicação/recebimento via
transporte injetado, logs filtrados, assinatura única, recuperação de falhas,
encerramento e integração com CRUD/upload. Também exercitam o cliente Redis real
contra uma porta recusada, sem exigir servidor externo. Os testes existentes
continuam independentes de Redis (`REDIS_URL` vazio no Vitest).

Nesta etapa passaram 254 testes backend e 3 frontend, build backend e validação
estrutural do Compose. A demonstração com servidor Redis real **não foi executada**:
o Docker CLI está instalado, mas o daemon está inativo. Os testes com transporte
injetado e conexão recusada não são apresentados como integração Redis real.

Referências: [semântica de Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)
e [assinatura com node-redis](https://github.com/redis/node-redis/blob/master/docs/pub-sub.md).
