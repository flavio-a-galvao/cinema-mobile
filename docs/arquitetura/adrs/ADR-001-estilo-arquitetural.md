# ADR-001 — Aplicação web cliente-servidor com backend monolítico

- **Status:** adotada no código; registro retrospectivo.
- **Data do registro:** 05/11/2026; base `e23bd86`.

## Contexto

O Cinemax reúne catálogo, programação, identidade, ingressos e pagamentos.
O [front-end](../../../Projeto-front-end/src/App.tsx) é uma SPA React; a
[API](../../../Projeto-back-end/src/app.ts) registra todos os recursos em um
único Express e compartilha os models e o banco.

## Decisão

Descrever e manter a arquitetura existente como cliente-servidor, com backend
monolítico organizado em camadas técnicas: entrada HTTP/middlewares, controllers,
serviços auxiliares e models Sequelize. O deploy separa frontend, backend e
infraestrutura, sem transformar cada recurso em um serviço independente.

## Justificativa

Como avaliação técnica retrospectiva, essa organização favorece a compreensão
acadêmica, a execução local e transações entre dados relacionados, com uma única
API para os fluxos web. Essas razões são inferidas do desenho atual; não há
registro de que a equipe tenha realizado uma seleção formal entre estilos.

## Alternativas consideradas neste registro

- Microsserviços por contexto: permitiriam implantação independente, mas
  acrescentariam contratos remotos e coordenação de consistência.
- Monólito com fronteiras de domínio explícitas: melhoraria o isolamento interno,
  exigindo mudanças que não fazem parte desta documentação.
- Renderização integral no servidor: reduziria a separação cliente/API, mas
  substituiria a estratégia React existente.

Não se afirma que essas alternativas foram implementadas ou experimentadas.

## Consequências

- Uma implantação do backend reúne todas as áreas; falhas do processo e mudanças
  incompatíveis podem afetar vários fluxos.
- Regras e persistência estão acopladas nos controllers. Não há domínio puro,
  camada de repositories ou arquitetura hexagonal implementada.
- Redis introduz comunicação assíncrona auxiliar; isso não torna o sistema uma
  arquitetura integralmente orientada a eventos.
- Os [Bounded Contexts](../DDD.md) são análise conceitual, não módulos isolados já
  existentes. A extração de serviços precisaria de nova decisão e validação.

## Rastreabilidade

[Rotas](../../../Projeto-back-end/src/app.ts),
[inicialização única](../../../Projeto-back-end/src/server.ts),
[topologia C4](../C4_CONTAINERS.md) e [ADR-002](ADR-002-organizacao-backend.md).
