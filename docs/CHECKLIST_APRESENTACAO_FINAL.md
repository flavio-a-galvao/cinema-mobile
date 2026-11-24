# Checklist de apresentação — lacunas da rubrica

> **Apresentação atual.** Use o roteiro curto, a prova da bilheteria integrada e os registros reais do Jira. Apresente o PR #8 como candidato. Os procedimentos operacionais abaixo complementam o roteiro. [Roteiro](ENTREGA_FINAL.md#roteiro-de-5-a-7-minutos) · [Bilheteria](https://github.com/flavio-a-galvao/cinema-mobile/blob/43380fe32682d9b04de9f3db74617fc5bbfc6abc/docs/evidencias/kan-26-correcao-web.md)

Preparado em 11/11/2026. Usar o [relatório atualizado](RELATORIO_FINAL_RUBRICA.md)
para distinguir resultado atual, evidência histórica e pendência. Não refazer o
mobile nem apresentar mocks como integração real.

## Preparar a sessão

- [ ] Confira a raiz e a referência atual com `git status -sb` e `git log -1 --oneline origin/main`.
- [ ] `docker version` mostra Server Linux. Conferir containers/volumes existentes
  com `docker ps` / `docker volume ls`; não remover nem parar ambientes alheios.
- [ ] Abrir [infraestrutura](INFRAESTRUTURA_DOCKER.md) e executar seu bloco isolado.
  Cada chamada do preparador cria outro projeto. Para inspecionar um já criado:

```powershell
# Selecionar explicitamente o run.json da execucao desejada, sem imprimir environment.env.
$runPath = Read-Host 'Caminho do run.json em .audit-tmp/infra/<projeto>/'
$run = Get-Content -LiteralPath $runPath -Raw | ConvertFrom-Json
$compose = @('compose','--env-file',$run.envFile,'-p',$run.project,'-f','docker-compose.yml','-f','docker-compose.rubrica.yml')
docker @compose ps
docker @compose exec -T nginx nginx -t
curl.exe --cacert $run.certificate --resolve cinema.local:18443:127.0.0.1 https://cinema.local:18443/api/catalogo/filmes
curl.exe -I --resolve cinema.local:18080:127.0.0.1 http://cinema.local:18080/catalogo
```

Não usar `-k`. No navegador, configurar hostname/CA de desenvolvimento confiável
conforme o guia antes de abrir `https://cinema.local:18443/`; não instalar o
certificado como CA global sem decisão do titular. O verificador valida o par
autoassinado explicitamente. Não capturar tokens, senhas, environment.env ou chaves.

## Back-end: telas e comandos

| Critério | Terminal/tela | Comprovação necessária |
| --- | --- | --- |
| B1 Cache Redis | JSON novo `infra-<projeto>.json`, checks `cache_miss_hit`, `cache_ttl`, `cache_invalidation`, `redis_fallback`, `redis_recovery` | Miss faz +1 SET, hit +0; TTL positivo e expiração; atualização persiste no MySQL; API continua com Redis parado e reconecta |
| B2 Pub/Sub | Check `pubsub_real` e `circulation`; `docker @compose logs --no-color backend` | Seis tipos; publication/consumption compartilham eventId; assinaturas voltam após falha. Mensagem durante outage não tem replay garantido |
| B3 Infraestrutura | `docker @compose ps`, `nginx -t`, HTTPS/redirect acima, arquitetura da rede e mounts | Cinco serviços healthy, fonte MySQL real, TLS validado, SPA/JS e CSP/HSTS; volumes com prefixo exclusivo do projeto |
| B4 Observabilidade | Check `observability_real`, JSON de testes e logs pelo correlationId registrado | `/api/metrics` sem token 401 e admin 200; delta de contadores no mesmo processo, buckets e requestId nos logs. Não extrapolar para SLO mensal |
| Integridade MySQL / gate de release | Resultado do ensaio `pagamentos.mysql.integration.cjs`, quando executado, com nome do projeto isolado | Emissão/pagamento concorrentes 201/409, unicidade e limpeza dos registros criados pelo ensaio |

Para repetir o ensaio automático: preparar **outro** ambiente e executar
`node scripts/verify-redis-infra.cjs $run.project $run.envFile $run.evidence`.
Uma evidência existente não será sobrescrita. O ensaio para/reinicia somente o
Redis identificado e cria/remove dados sintéticos no banco desse projeto.

Ensaiar SQL somente no backend desse mesmo ambiente (nunca no banco existente):

```powershell
docker @compose exec -T -u root backend mkdir -p /app/tests
docker @compose cp Projeto-back-end/tests/pagamentos.mysql.integration.cjs backend:/app/tests/pagamentos.mysql.integration.cjs
docker @compose exec -T -e CINEMAX_MYSQL_INTEGRATION_ISOLATED=1 backend node --test tests/pagamentos.mysql.integration.cjs
```

## Tech Forge — demonstração da gestão real

- [ ] Abra o projeto Jira existente e demonstre o backlog conciliado, com os 30 itens originais e a Story de auditoria. Confira participantes e papéis que ainda dependem de confirmação. [Guia Jira](gestao/JIRA_GUIA.md)
- [ ] Abra os comentários do PR #10 integrado e o CI correspondente. Identifique os aceites e dependências ainda pendentes. [Registros da bilheteria](gestao/ACEITES_TECNICOS.md#bilheteria--kan-29-kan-30-e-kan-26)
- [ ] Abrir backlog, Epic com filhos e dependências vinculadas pelas chaves reais;
  mostrar responsável confirmado e critérios. Description não cria links Jira.
- [ ] Abrir quadro com políticas/WIP e histórico de movimentos que efetivamente
  ocorreram. Não inventar sprints, Done, assignees ou datas antigas. Bugs corrigidos
  tecnicamente precisam de aceite atual, sem reimplementação.
- [ ] Demonstrar Cynefin e planejamento já existentes; registrar condução/revisão
  reais e rastreabilidade issue → commit → evidência, sem refazer os documentos.

## Entregas parciais e release

- [ ] `node scripts/prepare-partial-deliveries.cjs`: abrir os três ZIPs em
  `.audit-tmp/entregas/` e o [manifesto](evidencias/complementacao/entregas.json).
  Mostrar SHA, SHA-256, escopo e diferença entre snapshots. Não são releases.
- [ ] Mostrar no GitHub commits `e23bd86`, `c826368` e `d59723b`, notas do
  [planejamento](gestao/PLANEJAMENTO_AGIL.md) e evidências correspondentes.
- [ ] Antes de tag/release, conferir o CI e o escopo da evidência E2E no SHA escolhido,
  resolver impeditivos, obter revisão/aceite e definir versão SemVer. As execuções
  de CI antigas não validam automaticamente um SHA novo.
- [ ] Titular autoriza publicação verdadeira; então registrar tag/SHA, notas,
  hashes/artefatos e limitações. Sem esse passo, declarar publicação pendente.

Encerrar apenas o ensaio: `docker @compose stop --timeout 15`. Não usar `-v`,
prune ou reset. Guardar evidência nova sem apagar os registros históricos.
