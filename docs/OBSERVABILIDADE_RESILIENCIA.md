# Observabilidade, resiliência, SLIs e SLOs

## Complementação de 11/11/2026

Os resultados da seção final são históricos. Nesta complementação passaram
45 testes relevantes e a integração **real** por Nginx/HTTPS/MySQL/Redis, no projeto
`cinemax-rubrica-1a9aa7106a28`. O check `observability_real` comprova métricas
admin 200, sem token 401, delta de requisições no mesmo processo e UUID devolvido
no header/encontrado nos logs. [Evidência nova](evidencias/complementacao/infra-cinemax-rubrica-1a9aa7106a28.json).
O [ensaio MySQL](evidencias/complementacao/mysql-integracao.txt) passou seis
verificações, incluindo operações críticas concorrentes. Não é medição mensal,
teste de carga ou E2E completo de navegador; as metas de SLO continuam propostas.

## Implementação e escopo

Instrumentação nativa de Node/Express, sem dependências novas. Os contratos de
negócio, JWT, Swagger, cache e Pub/Sub são preservados. Foi acrescentado
**GET `/metrics`**, somente para admin autenticado; no Nginx, **`/api/metrics`**.
O contrato está no [OpenAPI](API_OPENAPI.md).

Fontes: [logger](../Projeto-back-end/src/services/logger.ts),
[middleware HTTP/erros](../Projeto-back-end/src/middlewares/observability.ts),
[métricas](../Projeto-back-end/src/services/httpMetrics.ts),
[startup MySQL](../Projeto-back-end/src/services/databaseReadiness.ts) e
[configuração do banco](../Projeto-back-end/src/config/database/index.ts).

## Logs e correlação

Logs do runtime são JSON por linha, em stdout (`info`) ou stderr (`warn`/`error`).
Contêm `loggedAt` (emissão UTC), `timestamp`, `service`, `level`, `component` e
`action`. Em Pub/Sub, `timestamp` preserva a data do evento; `loggedAt` é o
instante do log. O envelope de evento/canais/eventId permanece inalterado.

`X-Request-Id` é devolvido nas respostas observadas. Somente UUID v4 válido
recebido é reutilizado; outro valor gera UUID novo. `AsyncLocalStorage` propaga
a correlação entre operações assíncronas da requisição. CORS permite/expõe o
header; Nginx já encaminha esses headers sem alteração. O consumidor Pub/Sub
assíncrono se correlaciona por `eventId`, sem presumir contexto HTTP.

O logger permite somente metadados controlados pelo código. Não registra body,
headers completos, URL/query original, JWT, senha, CPF, e-mail, IP, cookies,
objetos de erro, stack, SQL ou parâmetros. `route` usa template, sem valores de
IDs. `errorType`/`code` usam listas permitidas. SQL logging foi desativado no
Sequelize. Se os headers já foram enviados, registra o erro sanitizado e encerra
a conexão, sem imprimir o objeto bruto. IDs públicos de filme/sessão e UUIDs de eventos continuam nos logs
Pub/Sub. Os scripts de manutenção legados ficam fora dessa instrumentação.

| Componente/ação | O que registra |
| --- | --- |
| `http.request_completed` | Método, template, status, duração e correlação; inclui rejeições 4xx |
| `http.critical_operation_completed` | Emissão individual/lote, cancelamento e registro de pagamento; status distingue sucesso/rejeição, sem provar liquidação financeira |
| `http.request_error` / `request_aborted` | Exceção sanitizada ou conexão encerrada antes de concluir; aborto não prova rollback |
| `redis_cache.fallback` | Falha de leitura/gravação/invalidação, mantendo marcador `[cache Redis]`; aviso limitado a um por 5 s por cache |
| `redis_pubsub` | Ações anteriores de publicação, consumo, assinatura, conexão e avisos, com envelope comum |
| `database` | `startup_retry`, `ready`, `startup_failed`, `rooms_need_review` e falha de encerramento; salas são contadas, sem dump |
| `runtime` | Início HTTP, início/deadline de shutdown e falhas de startup |

Sucessos rotineiros de health, Swagger e estáticos não geram log HTTP, mas entram
nas métricas gerais. Não há tracing distribuído ou coletor central implantado.
Warnings Redis são limitados por frequência: contá-los não mede o total de falhas.

## Métricas e SLIs

`GET /metrics` retorna JSON com `Cache-Control: no-store`, sem consultar o banco.
Contadores são cumulativos **por processo**, com `startedAt` e `uptimeSeconds`;
reiniciar zera as séries. A coleta corrente termina depois do snapshot retornado.

| Campo | Definição |
| --- | --- |
| `http` | Todas as respostas/abortos observados pelo Express |
| `business` | Rotas de negócio casadas; exclui `/`, `/metrics`, Swagger, pôsteres e rotas não casadas |
| `routes[]` | Método/template e estatísticas; no máximo 256 séries, preservando totais globais se o limite for atingido |
| `completedRequests` | Respostas com evento `finish`, sem contagem duplicada |
| `serverErrors`, `clientErrors` | Respostas concluídas 5xx e 4xx separadamente |
| `abortedRequests` | `close` antes de `finish`; não entra na contagem/histograma de respostas concluídas |
| `statusCodes` | Contagem por status HTTP real |
| `latencyMs.sum` | Soma da duração do middleware até `finish`, em ms |
| `latencyMs.buckets` | Histograma cumulativo: 50, 100, 250, 500, 1000, 2000, 5000 ms e `+Inf` |

A média é `sum / completedRequests`. O primeiro bucket que inclui 95% das
respostas fornece limite superior aproximado do p95, não percentil exato; se for
`+Inf`, não há limite finito inferível. Não são guardadas amostras individuais.
Erros de parse anteriores ao casamento da rota entram em `http`, não em `business`.
Falhas antes de chegar ao Express exigem observação externa. `/` indica HTTP
ativo, sem comprovar saúde do banco ou sucesso semântico de uma compra.

## SLOs propostos e metodologia

**Metas propostas, não resultados medidos ou compromissos de produção.** Janela
de avaliação: 30 dias contínuos. Sem amostras, o indicador é **sem dados**.

| Objetivo | SLI | SLO proposto |
| --- | --- | --- |
| Disponibilidade externa | Probes GET `/api/catalogo/filmes?page=1&limit=1` com 200, JSON contendo `data` array e `pagination` objeto e conclusão até 2 s / probes programados válidos | Pelo menos 99,5%; probe a cada 60 s, fora do processo da API |
| Latência de negócio | Respostas de negócio concluídas até 500 ms / concluídas, incluindo 4xx/5xx | Pelo menos 95% até 500 ms |
| Erros de servidor | Respostas de negócio 5xx / concluídas | No máximo 1% |
| Interrupções | Abortos / (concluídas + abortos) de negócio | Indicador auxiliar, sem SLO aprovado |

1. Colete e armazene snapshots fora da API, sem guardar o JWT. Calcule deltas
   apenas entre amostras com o mesmo `startedAt`; registre resets e lacunas.
2. Use `ΔserverErrors / ΔcompletedRequests` e
   `Δbucket[le=500] / ΔcompletedRequests` de `business`. Se houver réplicas, some
   deltas/buckets antes da divisão; não faça média de percentis. Hoje há um backend.
3. O observador externo registra data, status, duração, validade do JSON e falha
   de transporte. Timeout, 5xx ou corpo inesperado falham a probe. Probe não
   executada/registro perdido é lacuna: não se presume API saudável.
4. Separe rejeições 400/401/403/409 e examine abortos por rota. Meça disponibilidade
   externamente: uma API parada não produz respostas nem 5xx próprios.
5. Informe versão, ambiente, tráfego e janela. Não extrapole teste curto para
   30 dias. O orçamento teórico de 99,5% em 30 dias é 216 minutos; probes por
   minuto apenas aproximam duração, sem observar os intervalos entre amostras.

Degradação proposta: mais de 1% de 5xx ou menos de 95% em até 500 ms numa janela
de 5 minutos com pelo menos 20 respostas; três probes consecutivas falhando;
warnings Redis por mais de 5 minutos; publicação sem consumo correlacionado por
15 s em teste controlado. Os últimos indicam dependência degradada, não provam
API indisponível. Não foi implantado agendador, coletor externo ou alerta automático.

## Resiliência aplicada e limites

| Área | Mecanismo | Limite |
| --- | --- | --- |
| MySQL | Conexão mysql2 em até 5000 ms; pool máximo 5, aquisição em até 5000 ms | Não é timeout de query/transação inteira |
| Startup MySQL | Até 10 `authenticate`, intervalos 500/1000/2000/depois 3000 ms | Só verificação de conexão transitória; schema/configuração não são repetidos |
| Negócio | `retry.max: 0` explícito no Sequelize | Sem retry genérico de pagamento, emissão, cancelamento ou outra query; contrato 500 central preservado |
| Cache Redis | Timeout 500 ms/operação, fila offline desativada, cooldown 5 s após falha | Fallback MySQL preservado; sem URL, cache desativado |
| Invalidação | Falha causa bypass local por um TTL | Não oferece consistência forte entre processos |
| Pub/Sub | Timeout de conexão/comando 500 ms, conexões distintas e reconexão progressiva com intervalo máximo 5 s | Transporte reconecta continuamente até `stop`, como antes; sem replay e sem repetir a mutação |
| Shutdown | Drena HTTP e encerra conexões; deadline interno 10 s e grace Compose 15 s | Resposta perdida exige reconciliação; não garante que tudo terminou |
| Infraestrutura | Healthchecks e restart policies anteriores | Sem HA, réplica MySQL ou cluster Redis |

O retry de startup aceita apenas `ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`,
`EHOSTUNREACH`, `ENETUNREACH`, `EAI_AGAIN`, `EPIPE` e
`PROTOCOL_CONNECTION_LOST`. `ENOTFOUND`, acesso negado, banco desconhecido e
erros não classificados falham imediatamente. Ajustes de schema não são repetidos.

Não foi criado circuit breaker genérico. Timeout/cooldown/fallback do cache já
limitam pressão de forma simples; isso não é uma máquina completa
closed/open/half-open. MySQL é a fonte única para escritas, sem alternativa que
preserve consistência. Um breaker exige política/contratos a validar quando
telemetria e carga justificarem. Não se usa `Promise.race` para devolver timeout
artificial de compra/pagamento: a escrita poderia concluir depois do erro HTTP.
Queries em andamento não receberam cancelamento geral. Pub/Sub segue best-effort,
sem outbox, replay ou garantia de processamento exatamente uma vez.

## Acesso, validação e evidências

```powershell
npm --prefix Projeto-back-end test -- --silent
npm --prefix Projeto-back-end run validate:openapi
npm --prefix Projeto-back-end run build
```

Com ambiente ativo e JWT de admin de teste, sem versionar/capturar o token:

```powershell
$cinemaxToken = Read-Host 'JWT de administrador de teste'
$cinemaxHeaders = @{ Authorization = "Bearer $cinemaxToken" }
Invoke-RestMethod -Uri 'http://127.0.0.1:3000/metrics' -Headers $cinemaxHeaders
Remove-Variable cinemaxToken, cinemaxHeaders
```

Pelo proxy, use `https://cinema.local/api/metrics` com a CA local confiável.
Diagnóstico, recuperação e rollback estão no [runbook](RUNBOOK_INCIDENTES.md).

Nesta etapa: **415 testes em 27 arquivos**, build aprovado e OpenAPI válido com
**34 caminhos/52 operações**. Testes verificam correlação concorrente, logs sem
segredos, erros, histogramas, abortos, autorização, retry limitado e fallback;
as suítes anteriores de Swagger, cache e Pub/Sub também passaram.
[Evidência local](evidencias/observabilidade-local.json) contém HTTP do build,
logs e falhas simuladas. Não houve MySQL/Redis/Nginx reais, teste visual, carga
ou medição mensal. Docker não foi executado. A [evidência Redis anterior](evidencias/redis-infra.json)
é histórica, sem reexecução. `Projeto-mobile/` permanece intacto.

Referências: [Node AsyncLocalStorage](https://nodejs.org/api/async_context.html),
[pool Sequelize v6](https://sequelize.org/docs/v6/other-topics/connection-pool/) e
[opções Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize).
