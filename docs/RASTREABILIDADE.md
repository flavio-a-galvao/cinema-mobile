# Matriz de Rastreabilidade — Cinemax

A matriz abaixo liga requisitos às principais evidências técnicas do projeto.

| Req. | Funcionalidade | Tela mobile | Service | Endpoint | Backend | Banco/Model | Teste principal |
|---|---|---|---|---|---|---|---|
| RF01 | Cadastro | `app/(public)/register.tsx` | `authService.ts` | `POST /users` | `users.controller.ts` | `User.ts` | `usuarios.test.ts` |
| RF02 | Login | `app/(public)/login.tsx` | `authService.ts` | `POST /auth/login` | `auth.controller.ts` | `User.ts` | `autenticacao.test.ts` |
| RF04 | Catálogo | `(tabs)/catalog.tsx` | `movieService.ts` | `GET /catalogo/filmes` | `filmes.controller.ts` | `Filme.ts` | `crud.filmes.test.ts` |
| RF06 | Detalhes/sessões | `movies/[id].tsx` | `movieService.ts`, `sessionService.ts` | `GET /catalogo/filmes/:id`, `GET /catalogo/sessoes` | `filmes.controller.ts`, `sessoes.controller.ts` | `Filme.ts`, `Sessao.ts` | `crud.sessoes.test.ts` |
| RF07 | Ocupação | `sessions/[id].tsx` | `seatService.ts` | `GET /sessoes/:id/ocupacao` | `ingressos.controller.ts` | `Ingresso.ts`, `Assento.ts` | `crud.ingressos.test.ts` |
| RF10 | Compra em lote | `sessions/[id].tsx` / confirmação | `ticketService.ts` | `POST /ingressos/lote` | `ingressos.controller.ts` | `Ingresso.ts` | `crud.ingressos.test.ts` |
| RF11 | Inteira/meia | Checkout | `ticketService.ts` | `POST /ingressos/lote` | `ingressos.controller.ts` | `Ingresso.ts`, `Sessao.ts` | `crud.ingressos.test.ts` |
| RF12 | Pagamento | `payment.tsx` | `paymentService.ts` | `POST /pagamentos` | `pagamentos.controller.ts` | `Pagamento.ts` | `crud.pagamentos.test.ts` |
| RF13 | Meus ingressos | `(tabs)/my-tickets.tsx` | `paymentService.ts` | `GET /me/compras` | `compras.controller.ts` | `Ingresso.ts`, `Pagamento.ts` | `compras.recuperacao.test.ts` |
| RF14 | Retomar pagamento | `(tabs)/my-tickets.tsx` | `paymentService.ts` | `GET /me/compras`, `POST /pagamentos` | `compras.controller.ts`, `pagamentos.controller.ts` | `Ingresso.ts`, `Pagamento.ts` | `compras.recuperacao.test.ts` |
| RF15 | Cancelar ingresso | `(tabs)/my-tickets.tsx` | `ticketService.ts` | `PATCH /ingressos/:id/cancelar` | `ingressos.controller.ts` | `Ingresso.ts` | `crud.ingressos.test.ts` |
| RF17 | CRUD filmes | `(admin)/admin-movie.tsx` | `movieService.ts` | `/filmes`, `/filmes/:id` | `filmes.controller.ts` | `Filme.ts` | `crud.filmes.test.ts` |
| RF18 | Pôster | `(admin)/admin-movie.tsx` | `movieService.ts` | `POST /filmes/:id/poster` | `posterUpload.ts`, `posters.controller.ts` | `Filme.ts` | `posters.test.ts` |
| RF19 | CRUD salas | `(admin)/admin-room*.tsx` | `adminCinemaService.ts` | `/salas`, `/salas/:id` | `salas.controller.ts` | `Sala.ts` | `crud.salas.test.ts` |
| RF20 | Gerar assentos | `(admin)/admin-room.tsx` | `adminCinemaService.ts` | `POST /salas/:id/assentos/gerar` | `salasAssentos.controller.ts` | `Sala.ts`, `Assento.ts` | `geracao-assentos.test.ts` |
| RF21 | CRUD sessões | `(admin)/admin-session*.tsx` | `adminCinemaService.ts` | `/sessoes`, `/sessoes/:id` | `sessoes.controller.ts` | `Sessao.ts` | `crud.sessoes.test.ts` |
| RF22 | Admin x cliente | layouts/Admin | services autenticados | rotas administrativas | `auth.middleware.ts` | `User.ts` | `rotas.admin.test.ts`, `middlewares.test.ts` |

## Cadeia principal de evidência do CRUD

```text
Tela Mobile
    ↓
Service/Axios
    ↓
Endpoint Express
    ↓
Middleware de autenticação/autorização
    ↓
Controller
    ↓
Model Sequelize
    ↓
MySQL
```

Essa cadeia pode ser utilizada na apresentação para demonstrar o critério de CRUD completo App ↔ API ↔ Banco.
