# Diagrama Entidade-Relacionamento — Cinemax

O DER abaixo representa as entidades persistidas do projeto.

```mermaid
erDiagram
    USUARIO {
        INT id_usuario PK
        VARCHAR nome
        VARCHAR email UK
        VARCHAR senha
        ENUM tipo_usuario
        DATETIME data_criacao
    }

    CLIENTE {
        INT id_cliente PK
        VARCHAR nome
        VARCHAR cpf UK
        VARCHAR email UK
        VARCHAR telefone
        DATE data_nascimento
    }

    FILME {
        INT id_filme PK
        VARCHAR titulo
        VARCHAR genero
        VARCHAR classificacao_etaria
        INT duracao
        TEXT sinopse
        VARCHAR poster_url
        DATE data_lancamento
    }

    SALA {
        INT id_sala PK
        VARCHAR nome
        INT capacidade
    }

    ASSENTO {
        INT id_assento PK
        INT id_sala FK
        VARCHAR numero
        VARCHAR fila
    }

    SESSAO {
        INT id_sessao PK
        INT id_filme FK
        INT id_sala FK
        DATETIME horario
        DECIMAL preco
    }

    INGRESSO {
        INT id_ingresso PK
        INT id_sessao FK
        INT id_cliente FK
        INT id_assento FK
        DATETIME data_compra
        ENUM tipo_ingresso
        DECIMAL valor_unitario
        ENUM status
        DATETIME cancelado_em
    }

    PAGAMENTO {
        INT id_pagamento PK
        INT id_ingresso FK
        DECIMAL valor
        ENUM metodo_pagamento
        DATETIME data_pagamento
    }

    SALA ||--o{ ASSENTO : possui
    FILME ||--o{ SESSAO : possui
    SALA ||--o{ SESSAO : recebe
    SESSAO ||--o{ INGRESSO : gera
    CLIENTE ||--o{ INGRESSO : compra
    ASSENTO ||--o{ INGRESSO : referencia
    INGRESSO ||--o| PAGAMENTO : possui
```

## Cardinalidades

- Uma **Sala** possui vários **Assentos**.
- Um **Filme** pode possuir várias **Sessões**.
- Uma **Sala** pode receber várias **Sessões**.
- Uma **Sessão** pode possuir vários **Ingressos**.
- Um **Cliente** pode possuir vários **Ingressos**.
- Um **Assento** pode aparecer em ingressos de sessões diferentes.
- Um **Ingresso** possui zero ou um **Pagamento**.

## Observação importante sobre Usuario e Cliente

`Usuario` e `Cliente` são entidades distintas e **não possuem chave estrangeira direta entre si** no banco atual.

A associação operacional do cliente autenticado é feita pela aplicação utilizando o **e-mail do JWT** para localizar/criar o registro de `Cliente`. Portanto, o DER não apresenta uma FK inexistente entre `usuarios` e `clientes`.

## Restrições de integridade relevantes

- E-mail de usuário é único.
- E-mail de cliente é único.
- CPF de cliente é único.
- `(id_sala, fila, numero)` é único para assentos.
- Um assento ativo não pode ser duplicado na mesma sessão.
- `id_ingresso` é único em pagamentos, impedindo dois pagamentos para o mesmo ingresso.
