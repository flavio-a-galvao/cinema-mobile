# Infraestrutura Docker, HTTPS e integração Redis

## Organização e correções

O Compose principal contém MySQL, Redis, backend, frontend e proxy Nginx.
MySQL e Redis não publicam portas. Redis usa rede interna exclusiva com backend.
A API direta fica restrita a `127.0.0.1:3000`; o proxy recebe HTTP/HTTPS em 80/443.
O backend aguarda o healthcheck do banco; o proxy aguarda backend e frontend.
Redis permanece opcional para a disponibilidade da API. Há healthchecks nos cinco
serviços, e o backend tem 15 s para drenar requisições e encerrar conexões.

Os Dockerfiles usam Node 24 e `npm ci`, builds em estágios separados e contextos
sem dependências do host ou `.env`. O backend roda como usuário `node` e preserva
uploads no volume. O frontend serve o build React estático com fallback de SPA,
sem expor servidor de desenvolvimento; alterações exigem rebuild. Para hot reload
fora dos containers, os comandos `npm run dev` existentes continuam disponíveis.

O proxy encaminha `/api/` ao backend removendo esse prefixo, `/posters/` ao backend
e demais URLs ao frontend. Usa DNS Docker para re-resolver os serviços, TLS 1.2/1.3,
HSTS e CSP, sem `script-src unsafe-inline` ou cabeçalhos Upgrade desnecessários.
O limite de 6 MB acomoda os uploads permitidos de 5 MB mais multipart.

Nomes fixos de containers foram removidos do Compose principal para permitir
projetos isolados. Os nomes dos volumes lógicos `mysql-data` e `posters-data`
permanecem iguais. **Mantenha o nome do projeto antigo ao reutilizar dados**;
um projeto diferente cria volumes diferentes. Não use `down -v` ou prune.
Em bancos já inicializados, trocar senhas no `.env` não troca senhas no MySQL.
O SQL inicial usa `cinema_db`; mantenha `DB_NAME=cinema_db` com esse seed.

## TLS local sem enfraquecer produção

O clone tinha `cinema.local.crt`, mas não a chave `cinema.local.key` exigida pelo
Nginx. Não se deve inventar uma chave para o certificado antigo. `TLS_CERTS_DIR`
seleciona um **novo par correspondente** em `certs/local/`, ignorado pelo Git.
Não há modo que desative TLS, HSTS ou validação de certificado em produção.

Para navegar localmente, instale mkcert e use uma CA de desenvolvimento confiável:

```powershell
New-Item -ItemType Directory -Force certs/local | Out-Null
mkcert -install
mkcert -cert-file certs/local/cinema.local.crt -key-file certs/local/cinema.local.key cinema.local localhost 127.0.0.1 ::1
```

Execute isso apenas se não houver um par local a preservar. Configure no arquivo
hosts do Windows `127.0.0.1 cinema.local`. Alternativamente, o script abaixo gera
um certificado autoassinado de 30 dias via OpenSSL (inclusive o instalado com Git).
O verificador confia **explicitamente nesse certificado**, mantendo validação de
assinatura e hostname. Não usa `-k`, `NODE_TLS_REJECT_UNAUTHORIZED=0` ou equivalente.
Para navegador, prefira mkcert; em produção use certificados de uma CA apropriada
e segredos fornecidos fora do repositório. Nunca versione chave privada ou PFX.

## Inicialização normal (PowerShell na raiz)

```powershell
docker version
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Edite .env: credenciais do seu banco, JWT_SECRET forte e TLS_CERTS_DIR.
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 240
docker compose ps
docker compose exec nginx nginx -t
curl.exe --cacert certs/local/cinema.local.crt --resolve cinema.local:443:127.0.0.1 https://cinema.local/api/catalogo/filmes
```

Para mkcert, `--cacert` deve apontar à CA (`mkcert -CAROOT`), não ao certificado
folha; navegadores usam a CA instalada. O verificador automático abaixo usa o par
autoassinado gerado por seu script de preparação. Se já usa mkcert, configure antes:
`$env:CINEMAX_CA_FILE = Join-Path (mkcert -CAROOT) 'rootCA.pem'`.

## Demonstração reproduzível e isolada ao professor

Pré-requisitos: Docker Desktop com Linux containers, Node 24/npm, portas 80/443/3000
livres e OpenSSL. Os comandos não alteram `.env`, usuários ou volumes do projeto
padrão. Reserve o nome `cinemax-infra-check` para esta demonstração:

```powershell
npm --prefix Projeto-back-end ci
powershell -ExecutionPolicy Bypass -File scripts/prepare-infra-check.ps1
docker compose --env-file .env.infra-check -p cinemax-infra-check config --quiet
docker compose --env-file .env.infra-check -p cinemax-infra-check up -d --build --wait --wait-timeout 240
node scripts/verify-redis-infra.cjs
```

O script de preparação não sobrescreve arquivos existentes. Gera senhas e segredo
JWT aleatórios em `.env.infra-check` e configura TTL de 3 s. O verificador só usa
esse projeto e cria um token administrativo de curta duração com esse segredo
local; isso testa o CRUD autorizado sem alterar contas ou simular um login.
Cria filme, sala e sessão de demonstração e remove esses registros após sucesso.
Se falhar, pode deixar seus registros no banco isolado para diagnóstico.

O verificador exerce HTTPS, redirect, SPA, arquivo JS e rota de pôster; confirma
persistência MySQL, miss/hit pelo contador `SET` do Redis, TTL via `PTTL`, invalidação
por versão, listas/paginação, CRUD e 404 não cacheado. Para testar fallback, para
**somente Redis desse projeto**, lê/edita dados via API, reinicia Redis e verifica
recuperação do cache e assinaturas. Confere os seis tipos Pub/Sub correlacionando
`eventId` em `published` e `consumed` dos consumidores reais do backend.

O resultado executado é salvo em `docs/evidencias/redis-infra.json`, sem senhas,
tokens ou chaves. Uma falha retorna código diferente de zero, sem marcar sucesso.

Para acompanhar manualmente durante a execução:

```powershell
docker compose --env-file .env.infra-check -p cinemax-infra-check logs -f backend nginx
docker compose --env-file .env.infra-check -p cinemax-infra-check exec redis redis-cli SUBSCRIBE cinemax:eventos:filmes cinemax:eventos:sessoes
docker compose --env-file .env.infra-check -p cinemax-infra-check exec redis redis-cli --scan --pattern 'cinemax:catalogo:*'
# Substitua pela chave observada; entradas antigas expiram pelo TTL.
docker compose --env-file .env.infra-check -p cinemax-infra-check exec redis redis-cli TTL 'cinemax:catalogo:filmes:VERSAO:id:ID'
```

Pub/Sub é efêmero: mensagens emitidas durante a indisponibilidade não são
reenviadas. Consulte também [cache](CACHE_REDIS.md) e [Pub/Sub](REDIS_PUBSUB.md).

## Evidências realmente executadas nesta etapa

Execução concluída em **2026-11-04T01:01:25.164Z** (03/11 no Brasil), Docker Engine
29.5.2, projeto `cinemax-infra-check`. Resultado completo:
[redis-infra.json](evidencias/redis-infra.json). Não são resultados simulados.

| Verificação executada | Resultado observado |
| --- | --- |
| Backend, MySQL, frontend, proxy e Redis | 5 serviços running/healthy |
| HTTP → HTTPS; página, SPA e JS | 301; 200 com certificado validado |
| Miss / hit do filme 3 | +1 `SET` no miss, +0 no hit; `PTTL=2004` ms |
| Expiração | Chave ausente após TTL, próxima consulta repopulou |
| Atualização | Versão trocada; título `Infra atualizado` também lido diretamente do MySQL |
| Redis parado | Leitura e edição HTTP 200, título `Infra fallback`, avisos presentes |
| Redis reiniciado | `PONG`, cache repopulado, um assinante por canal |
| CRUD de filme 3 e sessão 5 | 201/200/200; detalhe excluído 404 sem cache |
| Pub/Sub | Seis tipos publicados/consumidos; `eventId` correspondente |
| Nginx | `nginx -t`: syntax is ok; test is successful |
| Backend sem root | `uid=1000(node) gid=1000(node)` |

Trechos reais correlacionados dos logs capturados:

```json
{"component":"redis_pubsub","level":"info","action":"published","channel":"cinemax:eventos:filmes","eventId":"80d9a7c1-4550-4d12-b180-561396f7669a","type":"filme.created","id":3,"timestamp":"2026-11-04T01:01:04.556Z","subscribers":1}
{"component":"redis_pubsub","level":"info","action":"consumed","channel":"cinemax:eventos:filmes","eventId":"80d9a7c1-4550-4d12-b180-561396f7669a","type":"filme.created","id":3,"timestamp":"2026-11-04T01:01:04.556Z"}
```

Também passaram 254 testes automatizados backend, 3 frontend, builds locais dos
dois módulos, builds das duas imagens e validação dos dois manifestos Compose.
Os testes Playwright de navegador não foram executados nesta etapa. A prova HTTP
real cobre a comunicação dos cinco serviços, não todos os fluxos da interface.
`Projeto-mobile/` permaneceu sem alterações; chaves/segredos locais não foram
adicionados ao Git. Os cinco containers foram mantidos ativos para inspeção.

## Troubleshooting e encerramento

- `permission denied` no socket: execute em uma sessão com acesso ao Docker Desktop.
  `docker version` precisa mostrar **Server**. Se o daemon estiver parado, inicie-o;
  não confunda validação estática do Compose com integração executada.
- TLS `cannot load certificate`: confirme o par e o diretório montado. Após trocar
  certificados, recrie o proxy. Não use o `.crt` antigo com uma nova chave.
- 502: consulte `docker compose ps`, healthchecks e logs; valide `nginx -t`.
  `DB_HOST=database` e portas internas 3306/3000 independem das portas do host.
- Banco unhealthy: confira credenciais dos volumes existentes e o término do seed;
  não apague o volume para resolver uma senha desconhecida.
- Upload sem permissão em volume antigo criado por root: após backup, ajuste apenas
  sua propriedade com `docker compose run --rm --no-deps --user root backend chown -R node:node /app/uploads/posters`;
  os arquivos não são removidos. Novos volumes já recebem a propriedade correta.
- Porta ocupada: pare apenas seu ambiente anterior ou execute a demonstração em
  outro host; o redirect HTTP pressupõe HTTPS na porta 443.
- Conteúdo frontend antigo: `REACT_APP_API_URL` é argumento de **build**; use `/api`
  para mesma origem e execute `up -d --build` após mudanças.

```powershell
# Encerramento preservando os volumes (sem -v):
docker compose --env-file .env.infra-check -p cinemax-infra-check stop --timeout 15
# Para remover apenas containers/redes desse projeto, mantendo dados:
docker compose --env-file .env.infra-check -p cinemax-infra-check down --timeout 15
```

O manifesto legado `docker-compose.test.yml` continua disponível para E2E e agora
respeita `TLS_CERTS_DIR`; use-o isoladamente, sem mesclar volumes com o principal.
