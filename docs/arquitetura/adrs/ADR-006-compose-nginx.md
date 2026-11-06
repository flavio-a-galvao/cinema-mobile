# ADR-006 — Composição local com Docker Compose e proxy Nginx

- **Status:** adotada no código para ambiente local/acadêmico; registro retrospectivo.
- **Data do registro:** 05/11/2026; base `e23bd86`.

## Contexto

O ambiente precisa conectar frontend, API, banco e Redis, preservar dados e servir
o navegador por uma origem HTTPS. O clone não contém a chave privada do
certificado antigo; a execução depende de configuração local apropriada.

## Decisão

Usar o Compose principal com cinco serviços: `database`, `redis`, `backend`,
`frontend` e `nginx`. O frontend entrega build React por Nginx interno; o proxy
de entrada termina TLS, redireciona HTTP e encaminha API, SPA e pôsteres.

Manter dados MySQL e uploads em volumes nomeados e certificados/segredos fora das
imagens. Usar redes separadas para aplicação e cache, healthchecks e imagens
construídas com Node 24. O backend roda como usuário `node`.

## Justificativa

A composição explicita dependências e facilita repetir a demonstração em projeto
isolado. A mesma origem reduz a necessidade de configuração de CORS no navegador
e centraliza TLS e cabeçalhos. Essas razões são avaliação técnica do estado
atual, sem inventar histórico de aprovação da equipe.

## Alternativas consideradas neste registro

- Processos instalados diretamente no host: menos containers, maior dependência
  da configuração de cada notebook.
- Expor frontend e API separadamente: exigiria coordenar origens, URLs e TLS.
- Orquestrador de cluster: permitiria outros mecanismos operacionais, com custo
  superior ao ambiente local de cinco serviços.

## Consequências

- Portas externas 80/443 e API direta em loopback; MySQL/Redis sem portas
  publicadas. `cache-network` é interna, com API e Redis.
- Backend depende de MySQL saudável; Redis é opcional para disponibilidade HTTP.
  Healthchecks detectam condições específicas e não fornecem alta disponibilidade.
- Há `stop_grace_period: 15s` no Compose, mas o processo aplica deadline interno
  de 10 s para drenar e encerrar. Os limites não são uma medição de recuperação.
- TLS local exige par correspondente e confiança explícita. O proxy aplica HSTS
  e CSP; tráfego interno permanece sem TLS. O conflito original com Google Fonts
  foi corrigido na auditoria removendo referências externas, sem enfraquecer CSP,
  conforme [contexto](../C4_CONTEXTO.md).
- Volumes exigem backup e cuidado com o nome do projeto. Compose em host único
  não oferece redundância nem comprova prontidão para produção.
- `docker-compose.test.yml` é legado e não possui Redis. A prova Redis usa o
  Compose principal com projeto `cinemax-infra-check`, conforme documentação.
- GitHub Actions valida testes/builds; o job de deploy é demonstrativo. Não há
  publicação de produção automática implementada.

## Rastreabilidade

[Compose](../../../docker-compose.yml), [proxy](../../../nginx.conf),
[Dockerfile backend](../../../Projeto-back-end/Dockerfile),
[Dockerfile frontend](../../../Projeto-front-end/Dockerfile),
[shutdown](../../../Projeto-back-end/src/server.ts),
[infraestrutura e evidências](../../INFRAESTRUTURA_DOCKER.md) e
[CI/deploy](../../CI_DEPLOY.md).
