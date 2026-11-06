# Runbook de incidentes — Cinemax

## Preparação e triagem

Execute PowerShell na raiz, usando o **mesmo projeto Compose, ambiente e volumes**
afetados. Comandos abaixo assumem o Compose principal e `.env`. Se o ambiente usa
`-p`/`--env-file`, repita as opções sempre; exemplo isolado:

```powershell
docker compose --env-file .env.infra-check -p cinemax-infra-check ps
```

Não mescle o Compose legado de E2E com o principal; ele não declara Redis.
Os comandos são procedimentos e **não foram executados nesta etapa**.
Registre início/fuso, versão implantada, sintomas e impacto; preserve evidências
sanitizadas e correlacione respostas pelo `X-Request-Id`.

```powershell
docker compose ps
docker compose logs --since 10m --tail 100 backend
docker compose logs --since 10m --tail 100 database redis nginx
```

Revise logs legados de MySQL/Nginx antes de compartilhar: podem conter SQL, URL e
IP. Não publique `.env`, JWT, chaves ou dumps de requisições. Evite `docker inspect`
completo e `docker compose config` sem `--quiet`, que podem mostrar segredos.
Métricas e critérios de degradação: [observabilidade](OBSERVABILIDADE_RESILIENCIA.md).

## API indisponível

Sintomas: conexão recusada, 502, backend parado/reiniciando.

```powershell
docker compose ps backend database
docker compose logs --since 10m --tail 100 backend
curl.exe --max-time 3 -i http://127.0.0.1:3000/
docker compose exec -T backend node -e "fetch('http://127.0.0.1:3000/').then(r=>{console.log(r.status);process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"
```

Se internamente funciona, verifique proxy/portas. `/` indica HTTP ativo, sem
provar saúde MySQL; confira catálogo. `database.startup_failed` exige diagnóstico
do banco. `rooms_need_review` exige revisão preservando assentos. Não reinicie
repetidamente para corrigir credenciais ou falha de schema.
Após corrigir a causa, `docker compose restart backend`; se ainda não existe,
`docker compose up -d backend`. Confirme catálogo, login de teste, Swagger e
permissões. Reinício zera métricas. Não troque o nome do projeto para tentar
recuperar um banco aparentemente vazio: isso pode selecionar outros volumes.

## MySQL indisponível

Sintomas: `startup_retry`, falha de conexão/aquisição ou 500 nas operações de dados.

```powershell
docker compose ps database
docker compose logs --since 10m --tail 100 database
docker compose exec database mysql -u root -p
```

No cliente, com senha interativa:

```sql
SELECT 1;
SHOW FULL PROCESSLIST;
SHOW ENGINE INNODB STATUS\G
```

As últimas saídas podem expor consultas/dados; revise antes de compartilhar.
Verifique disco, seed, locks e conexões. Acesso negado exige conferir credenciais
do volume: mudar `.env` não muda senhas de banco inicializado. Banco desconhecido
ou `ENOTFOUND` exige conferir nome/host/DNS. Não mate transações sem avaliar impacto.
Se parado, `docker compose start database` ou `docker compose up -d database`.
Depois de saudável, reinicie backend somente se necessário. Startup tenta
conexão transitória até dez vezes; compras/pagamentos não são repetidos.
Verifique estado das compras antes de reenviar qualquer escrita.

## Redis indisponível

Sintomas: `redis_cache.fallback`, falha de publicação/conexão. API deve usar MySQL
se ele estiver disponível; cache não substitui o banco em falha simultânea.

```powershell
docker compose ps redis
docker compose logs --since 10m --tail 100 redis backend
docker compose exec -T redis redis-cli PING
```

Espere `PONG`. Confira rede interna e URL sem imprimir credenciais nem publicar
6379 no host. Se parado, `docker compose start redis`; reinicie apenas com causa
justificada. Cache reconecta após cooldown de 5 s; Pub/Sub tem conexão própria.
Confirme catálogo e novos eventos. Não reinicie MySQL por problema de Redis.
Redis é descartável e volta frio. Não use `FLUSHALL`, `KEYS *` ou `MONITOR` como
diagnóstico. Entrada antiga após falha de invalidação exige respeitar TTL e
revisar o problema; não apague dados de negócio para demonstrar fallback.

## Falhas Pub/Sub

```powershell
docker compose exec -T redis redis-cli PUBSUB NUMSUB cinemax:eventos:filmes cinemax:eventos:sessoes
docker compose logs --since 10m --tail 200 backend | Select-String 'redis_pubsub'
```

Em um backend, espere um assinante por canal. Zero: confira `REDIS_URL`, conexão,
startup e `subscribe_failed`. Mais de um pode refletir múltiplos processos reais;
não encerre assinantes só pela contagem. Compare `published`/`consumed` pelo mesmo
`eventId`. `invalid_event` exige investigar o emissor, sem relaxar validações.
Não injete eventos nem repita mutações para garantir consumo. Pub/Sub não retém
mensagens para replay. Após recuperar Redis, verifique um **novo evento de teste
autorizado**. Reinicie só backend se a conexão continuar travada após diagnóstico.
Registre mensagens potencialmente perdidas e limites de rastreabilidade.

## Erros Nginx/HTTPS

```powershell
docker compose ps nginx frontend backend
docker compose logs --since 10m --tail 100 nginx
docker compose exec -T nginx nginx -t
curl.exe --max-time 5 --cacert certs/local/cinema.local.crt --resolve cinema.local:443:127.0.0.1 -i https://cinema.local/api/catalogo/filmes
```

`--cacert` acima serve ao par autoassinado da demonstração. Com mkcert, use a CA
de `mkcert -CAROOT`, não o certificado folha. Não use `-k`. Confira hosts,
80/443, `TLS_CERTS_DIR` e par de certificado/chave correspondente; não gere chave
para certificado antigo nem compartilhe a chave. 502 exige conferir upstreams;
`/api/` é removido antes do backend. Swagger é `/api/api-docs/` no proxy.
Após corrigir e validar configuração, `docker compose exec -T nginx nginx -s reload`.
Se mounts/variáveis exigirem recriação, `docker compose up -d --force-recreate nginx`.
Revalide TLS, SPA e API; não retire CSP/HSTS para contornar erro.

## Recuperação, rollback e dados

1. Identifique versões atual e última aprovada. Preserve checkout, variáveis,
   certificados, uploads e nome do projeto; obtenha backup consistente e
   verificável antes de mudar schema/dados. Não há backup automatizado no projeto.
2. Reimplante imagens anteriores imutáveis se disponíveis. O projeto usa build
   local e não garante que exista imagem de rollback publicada.
3. Para reversão rastreável de código, em checkout limpo, use
   `git revert SHA_DO_COMMIT_PROBLEMATICO`, revise e valide. Não use `reset --hard`
   ou force push. Depois de obter código aprovado e conferir schema compatível:

```powershell
npm --prefix Projeto-back-end test -- --silent
npm --prefix Projeto-back-end run build
docker compose up -d --build backend frontend
docker compose ps
```

Rollback de código não desfaz ajustes de schema ou pagamentos registrados.
Pode ser necessário ajuste compatível para frente. Não restaure banco antigo
sobre dados novos sem autorização e análise de perda. Não remova `mysql-data`/
`posters-data`, não execute `down -v`, `prune --volumes`, exclusões SQL ou scripts
de limpeza como diagnóstico. Resposta perdida pode ter persistido: reconcilie
`/me/compras` e estado do ingresso antes de repetir pagamento/emissão.

Encerre o incidente após registrar causa/mitigação, impacto em dados, versões,
comandos, período observado e pendências. Confirme probes/catálogo, autorização
e estabilidade dos erros/métricas na janela efetivamente medida. Minutos de
recuperação não comprovam SLO mensal.
