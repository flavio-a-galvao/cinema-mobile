# API Cinemax — OpenAPI 3.0.3 e Swagger UI

## Artefatos e escopo

A [especificação JSON](../Projeto-back-end/src/docs/openapi.json) descreve as
**52 operações existentes em 34 caminhos**, incluindo a resposta básica `/` e
os aliases `/users` e `/usuarios`. Documenta métodos, parâmetros, corpos,
schemas, respostas, erros e Bearer JWT, a partir de
[rotas](../Projeto-back-end/src/app.ts), controllers, models e middlewares.

Não foram alterados endpoints, regras de negócio ou formatos existentes.
Na etapa OpenAPI foram adicionadas as rotas de documentação sob `/api-docs`;
a etapa seguinte acrescentou `/metrics` e o header de correlação `X-Request-Id`,
conforme [observabilidade](OBSERVABILIDADE_RESILIENCIA.md). Os arquivos
estáticos de pôsteres e as próprias rotas do Swagger não são operações de
negócio da especificação. `Projeto-mobile/` permanece intacto.

| Grupo | Caminhos relativos à raiz da API | Operações |
| --- | --- | --- |
| Sistema e autenticação | `/`, `/auth/login` | GET básico; POST de login |
| Observabilidade | `/metrics` | GET de métricas em memória, somente admin |
| Usuários | `/users`, `/users/{id}`, `/usuarios`, `/usuarios/{id}` | GET/POST de coleção; GET/PUT individual |
| Clientes | `/clientes`, `/clientes/{id}`, `/clientes/me` | GET/POST de coleção e perfil próprio; GET administrativo individual |
| Filmes | `/catalogo/filmes`, `/catalogo/filmes/{id}`, `/filmes`, `/filmes/{id}`, `/filmes/{id}/poster` | GET público; GET/POST/PUT/DELETE administrativos; POST multipart de pôster |
| Sessões | `/catalogo/sessoes`, `/catalogo/sessoes/{id}`, `/sessoes`, `/sessoes/{id}`, `/sessoes/{id}/ocupacao` | GET público; GET/POST/PUT/DELETE administrativos; GET de ocupação autenticado |
| Salas e assentos | `/salas`, `/salas/{id}`, `/salas/{id}/assentos/gerar`, `/assentos`, `/assentos/{id}`, `/catalogo/assentos`, `/catalogo/assentos/{id}` | CRUD de salas; POST de geração; GET/POST de assentos; GET público de assentos |
| Ingressos | `/ingressos`, `/ingressos/{id}`, `/ingressos/lote`, `/ingressos/{id}/cancelar` | GET administrativo; POST individual/lote; PATCH de cancelamento |
| Compras e pagamentos | `/me/compras`, `/pagamentos`, `/pagamentos/{id}` | GET de compras próprias; GET administrativo de pagamentos; POST de registro |

## Acesso ao Swagger

Com backend e suas dependências operacionais já configurados:

- Direto: [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/).
- Pelo Nginx: [https://cinema.local/api/api-docs/](https://cinema.local/api/api-docs/).
- JSON direto: [http://localhost:3000/api-docs/openapi.json](http://localhost:3000/api-docs/openapi.json).
- JSON pelo proxy: [https://cinema.local/api/api-docs/openapi.json](https://cinema.local/api/api-docs/openapi.json).

A API Express não possui prefixo `/api`; o Nginx recebe `/api/` e o remove antes
de encaminhar. Por isso, o Swagger do backend usa `/api/api-docs/` no proxy.
`https://cinema.local/api-docs/` continua sendo uma URL da SPA, não do backend.
Não foi necessário alterar [nginx.conf](../nginx.conf).

A barra final é importante para resolver arquivos relativos. O acesso sem barra
recebe redirect 308 relativo, preservando o prefixo. O `servers[0].url` é `..`,
resolvido em relação à URL do JSON: resulta em `/` direto e `/api/` pelo proxy.
Assim, **Try it out** utiliza a mesma origem e a raiz correta nos dois acessos.

Os assets de `swagger-ui-dist` são servidos pelo próprio backend. HTML e
inicializador JavaScript são separados para respeitar `script-src 'self'` da
CSP existente. Não há CDN, validação remota da especificação ou persistência
configurada de autorização; a UI não recebe segredos de variáveis de ambiente.
O build TypeScript copia o JSON para `dist/docs/`, incluído pela imagem existente.

Para executar localmente após preparar `.env` e MySQL conforme
[infraestrutura](INFRAESTRUTURA_DOCKER.md), use `npm --prefix Projeto-back-end run dev`
ou, após build, `npm --prefix Projeto-back-end start`. Redis é opcional para a
disponibilidade básica da API. O startup faz ajustes de schema e exige banco
disponível; o Swagger montado na API não transforma o servidor em um processo
independente dessas pré-condições.

## Autenticação e contratos que merecem atenção

1. Execute POST `/auth/login` com uma conta de demonstração já cadastrada.
2. Copie o JWT retornado e informe somente o token em **Authorize**; a UI adiciona
   `Bearer`. Nenhum JWT, senha utilizável ou CPF real é fornecido na documentação.
3. Operações com `x-roles: [admin]` exigem esse papel, além do JWT. Outras operações
   podem exigir titularidade, explicada na descrição. `funcionario` não equivale
   a `admin`.

**Try it out** envia requisições à API real: para a apresentação, use contas e
registros de teste. Tokens usados na sessão da página não são exemplos públicos
e não devem ser incluídos em capturas/evidências. A documentação não dispensa a
autorização existente em cada rota.

- Cadastro público sempre cria usuário `cliente`. PUT de usuário exige todos os
  campos, inclusive senha forte, mantém e-mail e permite somente a própria conta.
- `clientes/me` obtém e-mail do JWT. Cadastro de cliente por e-mail é upsert:
  retorna 201 ao criar ou 200 ao atualizar.
- Filmes, sessões e salas retornam array sem paginação; `page` ou `limit` ativa
  `data/pagination`. O controller converte e limita os números; não há validação
  explícita de integralidade. Assentos não possuem filtros/paginação implementados.
- Cliente e ingresso inexistentes nas consultas administrativas individuais
  retornam **200 com corpo vazio**; pagamento inexistente retorna **200 com JSON
  null**. Filme, sessão, sala, assento e usuário verificam existência com 404.
- Valores `DECIMAL` podem ser strings nas respostas dos models; a consulta de
  compras os converte para números. Campos legados de preço/tipo podem ser nulos.
- Emissão em lote cria de 1 a 10 ingressos atomicamente, com validação de
  titularidade, sala, horário e ocupação. Preço vem do servidor.
- Pagamento usa o snapshot do ingresso e data atual, ignorando valor/data do
  corpo. Pix/cartão/dinheiro são métodos registrados, sem gateway ou cobrança
  externa. Cancelar não produz estorno financeiro.
- Erros de validação explícita usam os códigos documentados. Exceções do ORM
  não tratadas especificamente seguem 500 com `message`; não foram inventadas
  respostas 400/409 para controllers que não as implementam.

Schemas de requisição representam o uso normal tipado. Algumas rotas também
convertem IDs com `Number` ou normalizam strings. OpenAPI é descritivo: não foi
adicionado middleware para impor novos contratos em tempo de execução.

## Validação reproduzível

Na raiz do repositório, com dependências do backend preparadas:

```powershell
npm --prefix Projeto-back-end run validate:openapi
npm --prefix Projeto-back-end run test:openapi
npm --prefix Projeto-back-end test
npm --prefix Projeto-back-end run build
```

- `validate:openapi` valida o arquivo fonte com `@apidevtools/swagger-parser`,
  incluindo estrutura OpenAPI 3.0.3 e referências locais; resolução externa está
  desativada. Não precisa de API, MySQL ou Docker em execução.
- `test:openapi` compara **todas** as operações da especificação com a AST
  TypeScript de `app.ts`, incluindo parâmetros de caminho, Bearer, papel admin
  e unicidade de `operationId`.
- Os testes HTTP exercitam rotas/middlewares reais com controllers isolados por
  mocks; verificam acesso público/protegido e negam acesso administrativo para
  cliente. Também verificam redirect, HTML, CSS/JS, JSON e resolução do servidor
  direto e sob `/api`, simulando a remoção do prefixo pelo proxy.
- A suíte completa existente continua cobrindo regras dos controllers. Os testes
  OpenAPI não substituem integração real com MySQL/Redis/Nginx nem uma auditoria
  completa de segurança ou validação de todas as respostas contra schemas.
- O CI existente já executa `npm test` e `npm run build`, incorporando o novo
  teste sem necessidade de modificar o workflow.

## Demonstração ao professor

1. Mostre o arquivo JSON, tags, schemas e indicação de segurança por operação.
2. Execute `validate:openapi` e `test:openapi`; apresente a saída real.
3. Com o ambiente de teste ativo, abra a URL adequada e execute GET público de
   filmes. Mostre parâmetros e a diferença entre array e resposta paginada.
4. Demonstre 401 em uma rota protegida sem token; autentique uma conta de teste
   e mostre a restrição administrativa, sem capturar o token.
5. Com admin de teste, inspecione o contrato de criação de sessão e upload.
   Se executar escrita, use registros descartáveis e apresente os status reais.
6. Relacione schemas/IDs/preços à persistência descrita na
   [ADR-003](arquitetura/adrs/ADR-003-mysql-sequelize.md) e ao [DER](DER.md).

## Resultado desta etapa e limites

Na etapa OpenAPI (commit `185f155`), em 05/11/2026: parser aprovou 33 caminhos/51 operações; 138 testes OpenAPI e a
suíte completa de **392 testes em 25 arquivos** passaram; build backend aprovado.
Um smoke test do build com controllers reais aprovou nove verificações HTTP
(documentação, assets, resposta básica e rejeições de autenticação/entrada), sem
consultar o banco.
Foram verificadas respostas HTTP do Swagger em servidor de teste local, com
simulação do prefixo. Não houve acesso visual em navegador, execução de Docker,
teste com Nginx real ou nova integração de negócio com banco neste notebook.
Essas demonstrações visuais/reais permanecem para o ambiente operacional.

Atualização na auditoria final: o Swagger foi renderizado e inspecionado em
Chrome headless, com 52 operações e sem erro de CSP no servidor HTTP local que
reproduz a política do proxy. Veja [captura](evidencias/auditoria/swagger-local.png)
e [registro](evidencias/auditoria/local.json). Isso não substitui teste do Nginx
ou HTTPS reais, ainda dependentes de daemon Docker funcional neste notebook.

Referências técnicas: [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3.html),
[Swagger UI](https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/)
e [Swagger Parser](https://apidevtools.com/swagger-parser/).
