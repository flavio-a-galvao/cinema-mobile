# Quality Scenarios — cenários de qualidade

## Convenções de avaliação

Cada cenário explicita origem, estímulo, ambiente, artefato, resposta e métrica.
**Metas propostas não são resultados medidos.** Testes existentes indicam um meio
de verificação; sua presença não significa execução nesta etapa.

A [evidência histórica de integração](../evidencias/redis-infra.json) registra
`passed` e oito verificações em `2026-11-04T01:01:25.164Z`. Ela cobre uma execução
local dos cinco serviços e não comprova SLO de produção, benchmark, segurança
integral, Playwright completo ou alta disponibilidade.

Rotas HTTP descritas abaixo usam `/api` no proxy; dentro do Express esse prefixo
é removido. Ensaios com falhas ou dados de teste devem usar apenas o projeto
isolado descrito em [Infraestrutura Docker](../INFRAESTRUTURA_DOCKER.md).
Nenhum desses ensaios foi executado nesta alteração documental.

## QS-01 — Desempenho: reaproveitamento de leitura do catálogo

| Campo | Especificação |
| --- | --- |
| Origem | Cliente web consultando um filme existente |
| Estímulo | Repetir GET `/api/catalogo/filmes/:id` com a mesma chave, primeiro fria e depois aquecida |
| Ambiente | API, MySQL e Redis disponíveis; sem mutações; TTL 60 s; ensaio local sequencial |
| Artefato afetado | `CatalogCache`, controller de filmes e consultas ao MySQL |
| Resposta esperada | Miss consulta banco e popula cache; hits retornam dados equivalentes sem chamar o loader do banco |
| Métrica verificável | Meta funcional: 1 chamada ao loader em 100 leituras na mesma versão e antes do TTL. Meta temporal proposta: p95 dos 99 hits menor que o p95 de 100 leituras equivalentes com cache desativado, em rodadas separadas e ambiente registrado |

**Verificação:** instrumentar chamadas ao loader e registrar tempos por requisição,
versões e tamanho do catálogo, aquecimento, erros e configuração do host. A janela
dos hits precisa terminar antes de 60 s; caso contrário o ensaio deve ser repetido.
O [teste de cache](../../Projeto-back-end/tests/cache.test.ts) verifica que o
segundo leitor não chama o loader novamente. O registro histórico
`cache_miss_hit` mostra SET no miss e nenhum SET adicional no hit; **não mede p95
nem contagem real de SELECTs**. O benchmark proposto permanece pendente.

## QS-02 — Disponibilidade: catálogo durante indisponibilidade do Redis

| Campo | Especificação |
| --- | --- |
| Origem | Falha do serviço Redis no ambiente de teste |
| Estímulo | Parar somente o Redis e realizar leituras e uma atualização autorizada de filme |
| Ambiente | MySQL/API/proxy disponíveis; dados descartáveis; uma instância de API; Redis parado por 60 s |
| Artefato afetado | Adaptador de cache, controllers e cliente Redis de publicação |
| Resposta esperada | Fallback ao MySQL; atualização persiste; falha de publicação gera aviso e não invalida o sucesso de negócio |
| Métrica verificável | Meta proposta: 20/20 leituras e 1/1 atualização com HTTP 200 durante a janela; nenhuma resposta acima de 2 s no ensaio sequencial local |

**Verificação:** registrar horário, status, duração e valor retornado/persistido.
O timeout de 500 ms é por operação do adaptador, não SLA HTTP. A evidência
`redis_fallback` registra atualização e leitura com 200 e avisos, sem comprovar
20 amostras ou o limite de 2 s. Falha simultânea de MySQL está fora deste cenário;
cache não garante disponibilidade dos casos de uso sem a fonte de verdade.

## QS-03 — Resiliência: recuperação de cache e assinaturas

| Campo | Especificação |
| --- | --- |
| Origem | Operador do ambiente isolado |
| Estímulo | Reiniciar Redis após a falha e criar nova alteração de filme |
| Ambiente | Mesmo backend ativo; rede e MySQL saudáveis; Redis volta a responder `PING` |
| Artefato afetado | Conexões de cache, publicador e assinante de `CatalogEvents` |
| Resposta esperada | Reconectar, restaurar assinatura para eventos futuros e repopular cache em leitura subsequente |
| Métrica verificável | Meta proposta: até 15 s após Redis voltar a responder, cada canal tem exatamente 1 assinante para 1 backend; nova leitura popula cache; novo evento tem `published` e `consumed` com mesmo `eventId` |

**Verificação:** coletar `PING`, `PUBSUB NUMSUB`, chave de cache e logs correlacionados
com timestamps. O [verificador existente](../../scripts/verify-redis-infra.cjs)
aguarda condições com timeout e faz consultas de assinantes; o registro
`redis_recovery` indica recuperação e `pubsub_real` correlaciona seis tipos.
Isso não mede um tempo total de recuperação de 15 s. Reconexão **não recupera
eventos perdidos** durante a falha; não há requisito de replay atendido pelo Pub/Sub.

## QS-04 — Resiliência de dados: concorrência pela ocupação

| Campo | Especificação |
| --- | --- |
| Origem | Dois clientes autenticados distintos |
| Estímulo | Emitir simultaneamente um ingresso para o mesmo assento da mesma sessão futura |
| Ambiente | MySQL real; cada cliente com perfil próprio; assento inicialmente livre; sem cancelamento concorrente |
| Artefato afetado | Transação de emissão, lock da sessão e índice `ingressos_assento_ativo_unique` |
| Resposta esperada | Uma emissão aceita; outra rejeitada por conflito; nenhuma ocupação ativa duplicada |
| Métrica verificável | Meta proposta: em 20 rodadas com pares inicialmente livres, exatamente um HTTP 201 e um 409 por rodada e `COUNT` de ingresso ativo por par igual a 1 |

**Verificação:** disparar chamadas em paralelo e consultar MySQL após cada rodada.
Há mecanismos em [IngressosController](../../Projeto-back-end/src/controllers/ingressos.controller.ts)
e [schema](../../Projeto-back-end/src/utils/ensureIngressosSchema.ts), além dos
[testes de ingressos](../../Projeto-back-end/tests/crud.ingressos.test.ts).
A evidência Redis não cobre corrida de emissão. As 20 rodadas reais e a
comparação HTTP/SQL estão pendentes; não se infere resultado apenas do lock.

## QS-05 — Segurança: autorização administrativa e titularidade

| Campo | Especificação |
| --- | --- |
| Origem | Requisitante sem token, token inválido ou cliente tentando agir sobre recurso alheio |
| Estímulo | POST administrativo de filme; POST de pagamento de ingresso pertencente a outro cliente |
| Ambiente | API disponível, tokens/contas de teste e dados de titularidade conhecidos |
| Artefato afetado | `requireAuth`, `requireAdmin`, controller de pagamentos e dados protegidos |
| Resposta esperada | Administração sem autenticação: 401; com papel cliente: 403. Pagamento alheio autenticado: 403; nenhuma escrita correspondente |
| Métrica verificável | Meta: 100% das combinações definidas retornam o status esperado e zero chamadas de escrita nos casos bloqueados; no ensaio real, zero linhas novas de pagamento |

**Verificação:** [testes de rotas](../../Projeto-back-end/tests/rotas.admin.test.ts),
[middlewares](../../Projeto-back-end/tests/middlewares.test.ts) e
[pagamentos](../../Projeto-back-end/tests/crud.pagamentos.test.ts) permitem
verificação automatizada com isolamento; a checagem SQL exige ambiente real.
Não foram executados aqui. Esse recorte não representa auditoria de segurança:
o segredo JWT tem fallback de desenvolvimento, a sessão fica em `localStorage`
e o CORS da API aceita `*`. Produção exige análise específica dessas condições.

## QS-06 — Segurança: transporte e fronteira do proxy

| Campo | Especificação |
| --- | --- |
| Origem | Navegador acessando a entrada pública local |
| Estímulo | GET HTTP seguido de acesso HTTPS à SPA e ao catálogo |
| Ambiente | Proxy do Compose principal, certificado correspondente e confiança explícita na CA/certificado local |
| Artefato afetado | Nginx de entrada e conexão navegador/proxy |
| Resposta esperada | HTTP redireciona para HTTPS; certificado/hostname validáveis; HSTS, CSP e proteção contra MIME sniffing presentes |
| Métrica verificável | Meta: HTTP 301, destino HTTPS correto, GET HTTPS 200 sem desativar verificação TLS e presença de `Strict-Transport-Security`, `Content-Security-Policy` e `X-Content-Type-Options: nosniff` |

**Verificação:** registrar cabeçalhos e resultado de conexão com CA explícita.
`nginx_tls_frontend` registra 301/200, SPA 200 e validação TLS; o script verifica
HSTS/CSP. A configuração contém `nosniff`, cuja captura específica deve ser
incluída ao repetir o cenário. TLS interno, API direta em loopback e teste de
intrusão não estão cobertos. Não foi reexecutado nem inspecionado em navegador
neste notebook.

## QS-07 — Manutenibilidade: alteração localizada de política de cache

| Campo | Especificação |
| --- | --- |
| Origem | Desenvolvedor mantendo a política de catálogo |
| Estímulo | Alterar o TTL de configuração ou uma regra de invalidação e submeter a mudança a revisão |
| Ambiente | Checkout limpo, Node 24 e dependências já preparadas; CI habilitado no repositório |
| Artefato afetado | `catalogCache.ts`, testes da política e documentação relacionada |
| Resposta esperada | TTL de ambiente não exige mudança de código; mudança da política preserva contratos públicos e passa por testes/builds |
| Métrica verificável | Meta para tarefa futura: zero mudanças em rotas, models, frontend e `Projeto-mobile/` para ajuste isolado de TTL; todos os testes aplicáveis e builds verdes; regra de invalidação coberta por teste que falhe com comportamento incorreto |

**Verificação:** comparar diff, executar suíte backend e validações de build/CI
quando a alteração funcional existir. [Testes injetáveis](../../Projeto-back-end/tests/cache.test.ts)
e [workflow](../../.github/workflows/ci.yml) já estão presentes. Não há medição de
tempo de manutenção ou execução CI desta etapa; a existência do workflow não
prova uma execução verde no GitHub. Deploy é apenas demonstrativo.

## QS-08 — Consistência do cache após alteração do catálogo

| Campo | Especificação |
| --- | --- |
| Origem | Administrador atualizando filme |
| Estímulo | PUT de título após aquecer detalhe, lista e página |
| Ambiente | Redis e MySQL saudáveis; requisições de leitura iniciadas após o PUT concluir; sem novas mutações |
| Artefato afetado | Versionamento da coleção e variantes do cache |
| Resposta esperada | Próximas leituras utilizam nova versão e o valor atualizado; chaves anteriores expiram |
| Métrica verificável | Meta: UUID de versão diferente e 3/3 leituras (detalhe, lista e página) com valor atualizado; cada nova entrada com TTL positivo e não superior ao configurado |

**Verificação:** registrar versão, valores e `PTTL`. `cache_invalidation` confirma
versão alterada, título atualizado/persistido e página em cache. Os
[testes](../../Projeto-back-end/tests/cache.test.ts) cobrem variantes e leitura
concorrente com invalidação em store simulado. O registro histórico não contém
todo o conjunto de medidas de TTL deste cenário. Falha de invalidação e leituras
iniciadas antes do commit têm limites descritos na
[ADR-004](adrs/ADR-004-cache-aside.md); não se afirma consistência forte.

## Registro de novas avaliações

Ao executar um cenário futuramente, anexar commit, data/fuso, configuração do
host, topologia, pré-condições, amostras, comandos e saída sanitizada. Informar
se usou mocks ou serviços reais e marcar cada meta como atendida/não atendida.
Preservar a evidência anterior; não converter metas pendentes em resultados
por simples referência a testes existentes.
