# ADR-002 — Organização técnica do backend por responsabilidades

- **Status:** adotada no código; registro retrospectivo.
- **Data do registro:** 05/11/2026; base `e23bd86`.

## Contexto

A API TypeScript utiliza `app.ts` para registrar rotas e `server.ts` para iniciar
HTTP, preparar o banco e encerrar conexões. Os recursos têm controllers e models
próprios, porém importam outros models quando o caso de uso exige.

## Decisão

Documentar a organização observada, preservando as responsabilidades abaixo:

| Diretório/arquivo | Responsabilidade |
| --- | --- |
| `src/app.ts` | Composição Express, rotas e tratamento final de erros |
| `src/server.ts` | Inicialização, ajustes de schema, sinais e encerramento |
| `src/controllers/` | HTTP, validações e coordenação de regras/transações |
| `src/models/` | Mapeamento Sequelize e restrições declaradas |
| `src/services/` | Políticas compartilhadas, incluindo cache e eventos |
| `src/middlewares/` | Autenticação, papel administrativo e upload |
| `src/config/`, `src/utils/`, `src/constants/` | Configuração e utilitários/regras auxiliares |
| `tests/` | Testes automatizados, majoritariamente isolados por mocks |

Esses são módulos técnicos, não pacotes de domínio autônomos. O fluxo típico é
rota → middleware → controller → model/Sequelize, com uso opcional de serviços.

## Justificativa

A separação facilita localizar cada responsabilidade e testar políticas de cache
e eventos por injeção de interfaces. Manter o desenho existente evita uma
refatoração funcional apenas para ajustar documentação. Trata-se de justificativa
retrospectiva; não de uma ata de decisão da equipe.

## Alternativas consideradas neste registro

- Organizar por funcionalidades/domínios: aproximaria cada caso de uso de seus
  dados, mas exigiria reorganizar imports e limites.
- Introduzir application services, repositories e domínio puro: permitiria
  independência do ORM, com custo de migração e novas abstrações.
- Concentrar toda a API em um arquivo: simplificaria o início, ampliando o
  acoplamento à medida que os recursos crescessem.

## Consequências

- A organização é navegável, mas controllers acumulam regras e acesso ao banco.
- `ComprasController` compõe dados de várias áreas; a nomenclatura dos arquivos
  não garante encapsulamento de Bounded Contexts.
- Uma regra compartilhada precisa de testes de regressão em seus consumidores.
- O arquivo `salas.controller.refatorado.ts` existe, mas `app.ts` importa
  `salas.controller.ts`; a descrição arquitetural segue o caminho efetivamente
  conectado às rotas.

## Rastreabilidade

[App](../../../Projeto-back-end/src/app.ts),
[compras](../../../Projeto-back-end/src/controllers/compras.controller.ts),
[cache injetável](../../../Projeto-back-end/src/services/catalogCache.ts),
[Vitest](../../../Projeto-back-end/vitest.config.ts) e [DDD](../DDD.md).
