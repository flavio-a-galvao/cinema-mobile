# Diagramas de Casos de Uso — Cinemax

## 1. Caso de Uso — Cliente

```mermaid
flowchart LR
    C[👤 Cliente]

    subgraph CINEMAX[Cinemax]
      UC1((Cadastrar conta))
      UC2((Realizar login))
      UC3((Consultar filmes))
      UC4((Pesquisar filme))
      UC5((Visualizar sessões))
      UC6((Selecionar assentos))
      UC7((Comprar ingressos))
      UC8((Realizar pagamento))
      UC9((Consultar meus ingressos))
      UC10((Continuar pagamento pendente))
      UC11((Cancelar ingresso))
      UC12((Alternar tema))
    end

    C --- UC1
    C --- UC2
    C --- UC3
    C --- UC4
    C --- UC5
    C --- UC6
    C --- UC7
    C --- UC8
    C --- UC9
    C --- UC10
    C --- UC11
    C --- UC12

    UC7 -. inclui .-> UC6
    UC8 -. estende .-> UC7
    UC10 -. estende .-> UC9
    UC11 -. estende .-> UC9
```

### Descrição resumida

O cliente se autentica, consulta o catálogo, escolhe uma sessão e assentos, define inteira/meia, confirma a compra e registra o pagamento. Depois pode consultar os próprios ingressos, retomar pagamento pendente ou cancelar quando permitido.

---

## 2. Caso de Uso — Administrador

```mermaid
flowchart LR
    A[👤 Administrador]

    subgraph CINEMAX[Cinemax - Administração]
      UA1((Realizar login))
      UA2((Gerenciar filmes))
      UA3((Enviar pôster))
      UA4((Gerenciar salas))
      UA5((Gerar assentos))
      UA6((Gerenciar sessões))
      UA7((Consultar dados administrativos))
    end

    A --- UA1
    A --- UA2
    A --- UA3
    A --- UA4
    A --- UA5
    A --- UA6
    A --- UA7

    UA3 -. estende .-> UA2
    UA5 -. estende .-> UA4
```

### Descrição resumida

O administrador utiliza as mesmas credenciais do sistema, porém seu perfil libera funcionalidades protegidas de administração. A API também verifica o perfil `admin`, portanto a restrição não depende apenas da interface.
