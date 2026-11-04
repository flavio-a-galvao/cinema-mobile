# Cache distribuído do catálogo

## Funcionamento

O back-end usa cache-aside nas listas completas, páginas e detalhes de filmes e
sessões. Um miss consulta o banco e grava JSON com `EX` (TTL em segundos); um hit
retorna o mesmo conteúdo serializado sem consultar o banco. Status HTTP e formatos
da API permanecem iguais. Somente dados públicos do catálogo entram no cache:
login, usuários, pagamentos, compras e ocupação de assentos não são cacheados.
Erros de consulta e registros inexistentes não são armazenados.

Chaves: `cinemax:catalogo:<filmes|sessoes>:<versão>:<variante>`, onde variante é
`all`, `page:1:limit:10` ou `id:1`. A versão fica em
`cinemax:catalogo:<coleção>:version` (inicialmente ausente, equivalente a `0`).
Após criar, editar ou excluir com sucesso, o controller troca a versão por um UUID.
Isso invalida todas as páginas e detalhes da coleção em todas as instâncias da API.
Uma consulta que começou antes da alteração só grava na versão antiga. As entradas
antigas desaparecem pelo TTL; as duas chaves de versão não expiram.

As rotas administrativas usam esses mesmos controllers. Upload de pôster também
invalida filmes. A edição transacional de sessão invalida apenas após o commit no
banco. Sessões contêm IDs de filme e sala, sem dados de filme incorporados; editar
um filme não exige invalidar sessões. As leituras administrativas do catálogo
compartilham o mesmo cache, sem alterar autorização ou conteúdo.

Redis é uma otimização: falhas de conexão, leitura, escrita, JSON e invalidação
não impedem acesso ao banco nem alteram o sucesso de uma gravação. Há limite de
500 ms por operação, fila offline desativada e intervalo de 5 s entre tentativas
de reconexão. Avisos `[cache Redis]` identificam a operação sem expor URL, senha
ou conteúdo. Avisos repetidos são limitados a um a cada 5 s.

Consistência é eventual: se o banco confirmar uma escrita e Redis estiver
indisponível para invalidar, entradas antigas em outras instâncias podem ser
usadas até expirar. A instância que detecta a falha ignora o cache pelo TTL.
Não existe transação atômica MySQL/Redis. Alterações externas diretamente no banco
também só aparecem após o TTL; para demonstração, use as rotas da API.

## Configuração e inicialização

Na raiz, crie `.env` a partir de `.env.example` se ainda não existir e ajuste as
credenciais do banco. Variáveis:

| Variável | Valor no Compose | Uso |
| --- | --- | --- |
| `REDIS_URL` | `redis://redis:6379` | Conexão compartilhada entre instâncias; aceita autenticação/TLS via URL |
| `CACHE_TTL_SECONDS` | `60` | Inteiro positivo; valores inválidos usam 60 segundos |

Fora do Compose, omitir `REDIS_URL` desativa o cache. No Compose, seu valor padrão
aponta ao serviço interno `redis`. O host não tem acesso direto à porta Redis.
Não compartilhe o mesmo Redis/banco lógico entre ambientes diferentes.

```powershell
docker compose --env-file .env.example config --no-env-resolution --quiet
docker compose up -d redis
docker compose ps redis
docker compose exec redis redis-cli PING
docker compose up -d --build database backend
```

O `PING` deve retornar `PONG`. A API continua disponível em
`http://localhost:3000`; não é necessário iniciar front-end ou Nginx para essa
demonstração. O backend não depende da disponibilidade do Redis para iniciar.
Redis usa uma rede `internal: true` exclusiva com o backend e healthcheck. Não há
volume persistente: os dados são reconstruíveis do banco e o cache começa vazio
após recriar o container. RDB/AOF estão desativados para não restaurar cache antigo.

## Demonstração ao professor (PowerShell)

1. Em um terminal, acompanhe comandos Redis (apenas no ambiente de demonstração):

   ```powershell
   docker compose exec redis redis-cli MONITOR
   ```

2. Em outro, consulte duas vezes a mesma URL:

   ```powershell
   $api = 'http://localhost:3000'
   Invoke-RestMethod "$api/catalogo/filmes"
   Invoke-RestMethod "$api/catalogo/filmes"
   Invoke-RestMethod "$api/catalogo/filmes?page=1&limit=10"
   Invoke-RestMethod "$api/catalogo/sessoes"
   docker compose exec redis redis-cli --scan --pattern 'cinemax:catalogo:*'
   ```

   No primeiro acesso, observe `GET` e `SET ... EX 60`; no segundo, os `GET` sem
   novo `SET` mostram o hit. O log SQL do backend (`docker compose logs backend`)
   permite conferir que o segundo acesso não fez outra consulta de catálogo.
   Se já havia cache, espere seu TTL expirar antes de demonstrar o miss.

3. Verifique o TTL da lista da versão atual:

   ```powershell
   $version = (docker compose exec -T redis redis-cli --raw GET cinemax:catalogo:filmes:version | Out-String).Trim()
   if (!$version) { $version = '0' }
   $key = "cinemax:catalogo:filmes:${version}:all"
   docker compose exec redis redis-cli TTL $key
   docker compose exec redis redis-cli GET $key
   ```

   `TTL` deve diminuir; `-2` indica chave expirada/ausente. Após mais de 60 s sem
   nova gravação, consulte a API para observar um novo miss e `SET`. Para acelerar,
   configure `CACHE_TTL_SECONDS=5` no `.env` e recrie o backend.

4. Autentique-se pelo fluxo existente como administrador e coloque o token em
   `$env:ADMIN_TOKEN`. Crie e edite um filme de demonstração:

   ```powershell
   $headers = @{ Authorization = "Bearer $env:ADMIN_TOKEN" }
   $movie = Invoke-RestMethod "$api/filmes" -Method Post -Headers $headers -ContentType 'application/json' -Body '{"titulo":"Demo Redis"}'
   $id = $movie.id_filme
   Invoke-RestMethod "$api/catalogo/filmes/$id"
   Invoke-RestMethod "$api/filmes/$id" -Method Put -Headers $headers -ContentType 'application/json' -Body '{"titulo":"Demo Redis atualizado"}'
   Invoke-RestMethod "$api/catalogo/filmes/$id"
   Invoke-RestMethod "$api/catalogo/filmes?page=1&limit=10"
   Invoke-RestMethod "$api/filmes/$id" -Method Delete -Headers $headers
   Invoke-RestMethod "$api/catalogo/filmes"
   docker compose exec redis redis-cli GET cinemax:catalogo:filmes:version
   ```

   Cada mutação troca a versão. A leitura seguinte mostra o novo título/lista e
   grava chaves da nova versão. Chaves antigas podem aparecer no `SCAN` até o TTL,
   mas não serão usadas. O detalhe excluído responde 404, sem guardar esse erro.
   Repita pelo painel administrativo para sessões: criar/editar/excluir uma sessão
   futura com filme e sala válidos troca `cinemax:catalogo:sessoes:version`.
   Upload de um pôster pelo painel troca a versão de filmes.

5. Para demonstrar fallback, pare somente Redis, consulte o catálogo e reinicie:

   ```powershell
   docker compose stop redis
   Invoke-RestMethod "$api/catalogo/filmes"
   docker compose logs --tail 30 backend
   docker compose start redis
   ```

   A API deve continuar consultando o banco e registrar o aviso de cache. Após o
   intervalo de reconexão, voltará a usar Redis. Não pare o banco nessa etapa.

## Validações

```powershell
npm run validate:push
npm --prefix Projeto-back-end run build
docker compose --env-file .env.example config --no-env-resolution --quiet
```

Os testes automatizados usam armazenamento injetado e relógio controlado para
hit/miss, TTL, versões compartilhadas, invalidação concorrente e falhas; também
exercitam o cliente Redis real contra uma porta local fechada para testar fallback.
Testes de controllers conferem invalidação após CRUD e após upload administrativo.
O Vitest desativa a URL do singleton para não depender de Redis local nos testes.
Isso não substitui a integração com um servidor Redis em execução.

Nesta implementação foram executados 239 testes de backend, 3 de frontend,
build do backend e validação do Compose. A integração com servidor Redis real
não foi executada: Docker CLI disponível, mas daemon inativo no ambiente.

Referências: [cliente Node.js oficial](https://redis.io/docs/latest/develop/clients/nodejs/connect/)
e [tratamento de falhas e timeouts](https://redis.io/docs/latest/develop/clients/nodejs/produsage/).
