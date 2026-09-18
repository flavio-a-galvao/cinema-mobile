# Requisitos Funcionais e Não Funcionais — Cinemax

## Requisitos Funcionais

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir o cadastro de um novo usuário cliente. |
| RF02 | O sistema deve permitir autenticação por e-mail e senha. |
| RF03 | O aplicativo deve restaurar uma sessão válida armazenada no dispositivo e permitir logout. |
| RF04 | O cliente deve poder consultar o catálogo de filmes. |
| RF05 | O cliente deve poder pesquisar filmes por título ou gênero. |
| RF06 | O cliente deve poder visualizar os detalhes de um filme e suas sessões. |
| RF07 | O cliente deve poder consultar os assentos de uma sessão e identificar os ocupados. |
| RF08 | O cliente deve poder selecionar múltiplos assentos de uma mesma sessão. |
| RF09 | O cliente deve informar as quantidades de inteira e meia correspondentes aos assentos escolhidos. |
| RF10 | O sistema deve criar de 1 a 10 ingressos por compra, um ingresso para cada assento. |
| RF11 | O sistema deve calcular o valor da inteira pelo preço da sessão e a meia por 50% desse valor. |
| RF12 | O cliente deve poder registrar um pagamento simulado por cartão, Pix ou dinheiro. |
| RF13 | O cliente deve poder consultar somente seus próprios ingressos/compras. |
| RF14 | O cliente deve poder continuar um pagamento pendente sem recriar o ingresso. |
| RF15 | O cliente deve poder cancelar um ingresso próprio antes do início da sessão. |
| RF16 | Um ingresso cancelado deve deixar de ocupar o assento da sessão. |
| RF17 | O administrador deve poder criar, consultar, editar e excluir filmes quando permitido. |
| RF18 | O administrador deve poder enviar um pôster para um filme. |
| RF19 | O administrador deve poder criar, consultar, editar e excluir salas quando permitido. |
| RF20 | O administrador deve poder gerar o mapa A1–F8 de assentos para uma sala sem duplicações. |
| RF21 | O administrador deve poder criar, consultar, editar e excluir sessões quando permitido. |
| RF22 | O sistema deve restringir funcionalidades administrativas a usuários com perfil `admin`. |
| RF23 | O cliente deve poder alternar entre tema claro e escuro no aplicativo. |
| RF24 | O aplicativo deve exibir um QR Code ilustrativo em cada ingresso para fins visuais, sem afirmar validade real. |

## Regras de negócio associadas

- Uma compra pode conter **de 1 a 10 assentos**.
- Um assento não pode possuir dois ingressos ativos para a mesma sessão.
- O assento escolhido deve pertencer à sala da sessão.
- A soma de inteira e meia deve ser igual ao número de assentos selecionados.
- O preço é validado/calculado no servidor.
- Uma sessão já iniciada não aceita nova compra.
- Apenas o dono pode cancelar o próprio ingresso.
- Um ingresso já cancelado não pode ser cancelado novamente.
- O cancelamento preserva o histórico e libera a ocupação.
- Um ingresso pode possuir no máximo um pagamento.
- O mapa atual de sala é padronizado em **48 lugares: 6 fileiras × 8 assentos**.

## Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| RNF01 | O aplicativo mobile deve ser desenvolvido em React Native/Expo com TypeScript. |
| RNF02 | A API deve ser desenvolvida em Node.js/Express com TypeScript. |
| RNF03 | A persistência deve utilizar MySQL acessado pelo Sequelize. |
| RNF04 | Rotas protegidas devem exigir JWT válido. |
| RNF05 | Senhas devem ser armazenadas com hash e não devem ser retornadas nas respostas da API. |
| RNF06 | O token de autenticação deve ser armazenado no mobile utilizando SecureStore. |
| RNF07 | Operações administrativas devem exigir autenticação e perfil de administrador também no backend. |
| RNF08 | O upload de pôster deve aceitar apenas os formatos autorizados e tamanho máximo de 5 MB. |
| RNF09 | O conteúdo da imagem deve ser validado antes da gravação e nomes de arquivos não devem colidir. |
| RNF10 | Operações críticas de compra devem preservar integridade por transação e restrições de unicidade. |
| RNF11 | A interface deve possuir estados de carregamento, erro e vazio nas principais consultas. |
| RNF12 | A interface deve funcionar nos temas claro e escuro e respeitar áreas seguras da tela. |
| RNF13 | O código deve ser organizado em rotas, componentes, contexts, services, types, controllers, models, middlewares e utilitários. |
| RNF14 | O ambiente de backend e banco deve poder ser executado por Docker. |
