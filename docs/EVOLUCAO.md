# Evolução do produto — Cinemax

A evolução do Cinemax ocorreu em etapas, adicionando funcionalidades de forma incremental e mantendo integração entre mobile, API e banco de dados.

## Etapa 1 — Base do projeto

O projeto já possuía uma API em Node.js/Express com Sequelize/MySQL e uma aplicação web legada. A base foi reutilizada e adaptada para atender também um aplicativo mobile.

## Etapa 2 — Fundação mobile

Foi criado o projeto mobile com Expo, React Native, TypeScript e Expo Router. Também foram definidos:

- estrutura de rotas;
- componentes reutilizáveis;
- tema visual;
- cliente Axios para comunicação com a API.

## Etapa 3 — Autenticação e perfis

Foram implementados:

- cadastro de usuário;
- login com JWT;
- armazenamento do token com SecureStore;
- restauração da sessão;
- logout;
- separação entre cliente e administrador;
- proteção das rotas administrativas no mobile e na API.

## Etapa 4 — Catálogo e sessões

O aplicativo passou a permitir:

- listagem dos filmes;
- pesquisa;
- detalhes de filme;
- consulta de sessões;
- navegação para a seleção de assentos.

## Etapa 5 — Assentos e compra

A compra evoluiu para suportar:

- mapa de assentos;
- identificação de assentos ocupados;
- seleção de vários assentos;
- limite de até 10 ingressos por operação;
- inteira e meia;
- criação transacional dos ingressos;
- proteção contra ocupação duplicada do mesmo assento.

## Etapa 6 — Pagamento e Meus Ingressos

Foram adicionados:

- pagamento simulado;
- cálculo autoritativo do valor pelo backend;
- proteção contra pagamento duplicado;
- histórico em "Meus Ingressos";
- recuperação de pagamento pendente;
- cancelamento de ingresso;
- liberação do assento após cancelamento.

## Etapa 7 — Administração completa

A área administrativa passou a oferecer:

- CRUD de filmes;
- upload de pôster;
- CRUD de salas;
- geração idempotente do mapa A1–F8;
- padronização de 48 lugares por sala;
- CRUD de sessões.

## Etapa 8 — Imagens e segurança

O upload de pôsteres foi protegido com:

- Multer;
- limite de 5 MB;
- validação de extensão;
- validação de MIME;
- validação do conteúdo real com Sharp;
- recodificação;
- UUID para nomes únicos;
- controle de acesso exclusivo para administradores.

Também foram reforçados:

- isolamento dos dados do cliente;
- proteção das rotas;
- validações no backend;
- unicidade de pagamento;
- integridade de ingressos e assentos.

## Etapa 9 — UI/UX final

A interface mobile recebeu uma identidade própria do Cinemax:

- temas claro e escuro;
- Home com destaque de filmes;
- catálogo em grid;
- pesquisa;
- bottom tabs com ícones;
- telas de filme e sessões reformuladas;
- mapa visual de assentos;
- tickets digitais;
- QR Code ilustrativo;
- formulários com máscaras e validações;
- painel administrativo reorganizado.

## Situação atual

O produto atual possui fluxo completo de cliente e administrador, integração App → API → Banco, regras de negócio no backend, upload de imagens, testes automatizados e interface mobile preparada para demonstração em dispositivo Android.
