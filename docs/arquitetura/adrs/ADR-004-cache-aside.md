# ADR-004 — Cache-aside distribuído de catálogo com Redis

- **Status:** adotada no código; registro retrospectivo.
- **Data do registro:** 05/11/2026; base `e23bd86`.

## Contexto

Listas, páginas e detalhes de filmes/sessões são leituras reutilizáveis. MySQL
precisa continuar como fonte de verdade e Redis não deve se tornar requisito
para o funcionamento básico da API.

## Decisão

Usar `CatalogCache.remember` com cache-aside: consultar Redis; em miss, consultar
MySQL e armazenar JSON com TTL. O TTL padrão é 60 s, configurável por
`CACHE_TTL_SECONDS` positivo. Sem `REDIS_URL`, o cache fica desativado.

As chaves usam `cinemax:catalogo:<colecao>:<versao>:<variante>`, com variantes
`all`, `page:<p>:limit:<n>` e `id:<id>`. Depois de mutações de catálogo, o controller
troca a versão da coleção por UUID; entradas antigas expiram pelo próprio TTL.

## Justificativa

Compartilhar Redis permite reutilizar cache entre instâncias da API, embora o
Compose atual execute uma única instância. O versionamento invalida listas e
detalhes sem varrer chaves e impede que uma leitura anterior repovoe a versão
nova. São razões técnicas inferidas da política implementada, sem benchmark de
latência atribuído à equipe.

## Alternativas consideradas neste registro

- Memória local: menor infraestrutura, sem compartilhamento entre processos.
- Consultar sempre MySQL: simplifica consistência e operação, sem reaproveitar
  respostas no Redis.
- Write-through ou exclusão individual de chaves: exigiriam outra coordenação
  entre escrita, listas paginadas e detalhes.

## Consequências

- Não há cache de `null`/404 ou erros do banco. Assentos, ocupação, ingressos e
  pagamentos não passam por essa política de catálogo.
- Falhas Redis fazem fallback ao banco; o adaptador limita operações a 500 ms e
  aguarda 5 s antes de nova tentativa após falha. Isso não limita o tempo total
  da requisição HTTP nem o tempo da consulta MySQL.
- Falha de invalidação ativa bypass **local ao processo** durante um TTL.
  Outras instâncias poderiam continuar lendo entradas antigas até expirarem.
- MySQL e Redis não participam de uma transação atômica. Há janela entre commit
  e invalidação; não existe promessa de consistência forte. Leituras iniciadas
  antes da mudança também podem retornar dados antigos.
- Leituras frias simultâneas podem consultar o banco em paralelo; não há controle
  de cache stampede, política explícita de limite de memória ou cluster Redis.
- O consumidor Pub/Sub não invalida cache: invalidação é chamada diretamente
  pelos controllers, de forma independente dos eventos.

## Rastreabilidade

[Política/adaptador](../../../Projeto-back-end/src/services/catalogCache.ts),
[filmes](../../../Projeto-back-end/src/controllers/filmes.controller.ts),
[sessões](../../../Projeto-back-end/src/controllers/sessoes.controller.ts),
[testes](../../../Projeto-back-end/tests/cache.test.ts),
[documentação operacional](../../CACHE_REDIS.md) e
[evidência histórica](../../evidencias/redis-infra.json).
