# Contextualização do problema — Cinemax

## 1. Problema

O Cinemax foi desenvolvido para centralizar, em uma única aplicação móvel, etapas que normalmente ficam separadas na experiência de um cinema: consulta de filmes, visualização de sessões, escolha de assentos, compra de ingressos e acompanhamento das compras realizadas.

Além da experiência do cliente, o projeto também contempla a necessidade administrativa de manter o catálogo do cinema atualizado, cadastrar filmes e pôsteres, organizar salas, gerar assentos e configurar sessões futuras.

O problema tratado pelo projeto pode ser resumido em dois pontos:

1. **Cliente:** precisa consultar opções e realizar a compra de ingressos de maneira simples, visual e segura pelo celular.
2. **Administrador:** precisa manter filmes, salas, assentos e sessões sem manipular diretamente o banco de dados.

## 2. Público-alvo

O público principal é formado por clientes de cinema que utilizam smartphones e desejam consultar filmes, escolher uma sessão, selecionar seus assentos e acompanhar seus ingressos.

Existe também um segundo ator: o **administrador do cinema**, responsável por manter as informações que aparecem para os clientes.

## 3. Solução proposta

O Cinemax é uma aplicação mobile integrada a uma API REST e a um banco de dados MySQL.

A solução permite ao cliente:

- criar conta e autenticar-se;
- consultar filmes em cartaz;
- pesquisar filmes;
- visualizar informações e sessões;
- consultar assentos disponíveis;
- selecionar múltiplos assentos;
- escolher ingressos do tipo inteira ou meia;
- concluir um pagamento simulado;
- consultar os próprios ingressos;
- recuperar pagamentos pendentes;
- cancelar um ingresso quando a regra permitir.

Ao administrador, a solução permite:

- gerenciar filmes;
- enviar e validar pôsteres;
- gerenciar salas;
- gerar o mapa padronizado de 48 assentos por sala;
- gerenciar sessões.

## 4. Objetivo geral

Desenvolver uma aplicação móvel de cinema com integração completa entre aplicativo, API e banco de dados, aplicando autenticação, autorização por perfil, regras de negócio, persistência de dados, upload seguro de imagens e práticas de organização de software.

## 5. Tecnologias principais

- **Mobile:** React Native, Expo, Expo Router e TypeScript.
- **Comunicação:** Axios e API REST.
- **Autenticação mobile:** SecureStore.
- **Backend:** Node.js, Express e TypeScript.
- **ORM:** Sequelize.
- **Banco de dados:** MySQL.
- **Autenticação:** JWT e bcrypt.
- **Imagens:** Multer e Sharp.
- **Infraestrutura:** Docker.
- **Testes:** Vitest e testes de integração com MySQL em pontos críticos.

## 6. Resultado esperado

O resultado esperado é uma experiência integrada em que os dados cadastrados pelo administrador passam pela API e pelo banco e aparecem no aplicativo do cliente, enquanto regras sensíveis, como ocupação de assentos, preço dos ingressos e controle de acesso, permanecem protegidas no backend.
