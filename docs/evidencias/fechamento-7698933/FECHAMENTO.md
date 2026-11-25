# Cinemax — evidências de fechamento independente

Em 24/11/2026 (São Paulo), main `7698933e2a6410d6f3adec1922dc6a962e408b51`. O ambiente descartável foi criado a partir dos arquivos desse commit com Compose principal e override da rubrica, Docker 29.5.3, Compose 5.1.4, Nginx 1.28.3 e MySQL 9.1.0. O proxy foi publicado só em loopback. Foram removidos apenas os recursos do projeto descartável. [Commit](https://github.com/flavio-a-galvao/cinema-mobile/commit/7698933e2a6410d6f3adec1922dc6a962e408b51) · [CI da main](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45438438269)

## Provas da execução

- **Swagger e Try it out.** Acesso direto no container e via Nginx retornaram HTTP 200 para a UI e o JSON. As raízes efetivas foram `/` e `/api/`, respectivamente. Chromium executou `GET /api/catalogo/filmes?page=1&limit=10` pelo Nginx real, sem JWT, e exibiu HTTP 200 com dois filmes e paginação. O processo de teste aceitou somente a chave temporária fixada para seu host. A verificação separada de HTTPS conferiu a CA temporária e o hostname. [JSON](swagger-try-it-out.json) · [Captura](swagger-try-it-out.png)
- **KAN-10 e KAN-12.** As 22 verificações HTTP via HTTPS passaram. Foram usados dois cadastros sintéticos e verificados papel cliente, ausência de senha/hash, CPF/e-mail inválidos, emissão de JWT, `401/403`, leitura/alteração apenas da própria conta e preservação do e-mail. Filmes e sessões foram consultados sem JWT em array e formato paginado e com detalhes `200/404`. A prova do pôster continua vinculada ao PR #7. Os IDs sintéticos foram redigidos no JSON publicado. [Resultados HTTP](nginx-http-kan10-kan12-kan23.json) · [Pôster](https://github.com/flavio-a-galvao/cinema-mobile/blob/7698933e2a6410d6f3adec1922dc6a962e408b51/docs/evidencias/kan-12-poster.md)
- **Docker/Nginx/TLS.** Cinco serviços saudáveis, `nginx -t` passou, redirecionamento HTTP 301 para HTTPS e SPA 200 com certificado verificado. O Redis respondeu `PONG` e havia inscrições em `cinemax:eventos:filmes` e `cinemax:eventos:sessoes`. [Stack](stack.json) · [Rotas e canais](rotas-e-canais.json) · [Limpeza](limpeza.json)
- **Aplicabilidade do ensaio anterior.** Backend, Compose principal e nginx.conf estão idênticos à base `d59723b`. O relatório anterior valida miss/hit, TTL, invalidação, fallback, recuperação e seis tipos de evento correlacionados por eventId. O verificador do ensaio histórico teve ajustes de execução. A rodada atual verificou saúde, TLS, Swagger e inscrições Redis, sem repetir o ciclo de falha/recuperação ou publicar cada tipo de evento. [Ensaio histórico](https://github.com/flavio-a-galvao/cinema-mobile/blob/7698933e2a6410d6f3adec1922dc6a962e408b51/docs/evidencias/complementacao/infra-cinemax-rubrica-1a9aa7106a28.json)

## Registro visual para KAN-28

A aba **Preview** do GitHub exibiu os três diagramas Mermaid no SHA auditado, com nós e relações renderizados e sem erro visual. As capturas feitas no GitHub permanecem na conversa. Este dossiê preserva as imagens legíveis já versionadas da auditoria anterior: comparei os três blocos Mermaid e os arquivos PNG com a base `d59723b` e confirmei igualdade. O manifesto registra os SHA-256 e separa imagens históricas dos previews auditados. [Manifesto KAN-28](diagramas-kan28.json) · [Contexto PNG](../auditoria/c4_contexto.png) · [Contêineres PNG](../auditoria/c4_containers.png) · [Context Map PNG](../auditoria/ddd.png). Os links seguintes abrem as páginas vistas no GitHub. [C4 Contexto](https://github.com/flavio-a-galvao/cinema-mobile/blob/7698933e2a6410d6f3adec1922dc6a962e408b51/docs/arquitetura/C4_CONTEXTO.md#escopo-e-responsabilidades) · [C4 Contêineres](https://github.com/flavio-a-galvao/cinema-mobile/blob/7698933e2a6410d6f3adec1922dc6a962e408b51/docs/arquitetura/C4_CONTAINERS.md#vis%C3%A3o-da-execu%C3%A7%C3%A3o) · [Context Map](https://github.com/flavio-a-galvao/cinema-mobile/blob/7698933e2a6410d6f3adec1922dc6a962e408b51/docs/arquitetura/DDD.md#context-map-conceitual)

## Minutas para conferência do responsável

- **KAN-10.** “Aceito os três critérios. O ensaio HTTPS com MySQL descartável confirmou cadastro como cliente sem senha/hash, CPF/e-mail inválidos com 400, JWT no login, restrições 401/403, consulta e edição próprias e preservação do e-mail.” [Issue](https://cinemax-projeto.atlassian.net/browse/KAN-10)
- **KAN-12.** “Aceito os três critérios. Filmes e sessões responderam sem JWT, com array ou paginação e detalhes 200/404. O fallback do pôster foi validado separadamente em Chrome com respostas controladas. O registro mantém o 403 anterior e identifica o SVG local integrado.” [Issue](https://cinemax-projeto.atlassian.net/browse/KAN-12)
- **KAN-28.** “Aceito a renderização observada no GitHub em `7698933` do C4 de contexto, C4 de contêineres e Context Map. O registro inclui as URLs por SHA, a conferência visual e imagens históricas com o mesmo código Mermaid.” [Issue](https://cinemax-projeto.atlassian.net/browse/KAN-28)
- **KAN-23.** Evidência complementar disponível para a revisão formal, respeitando dependências. A UI e o JSON direto/proxy responderam 200 e Try it out atingiu `/api/catalogo/filmes` pelo proxy real. A rodada visual exercitou uma operação pública GET. [Issue](https://cinemax-projeto.atlassian.net/browse/KAN-23)
- **KAN-18.** Testes e builds passaram e o job de deploy demonstrativo ficou pulado. O workflow propaga erro e o job demonstrativo depende de `validate`. O histórico consultado tem zero execuções com falha. Se o avaliador exigir prova observada, usar branch descartável a partir da main e um teste deliberadamente falho. Acionar o workflow manual nessa branch com `demonstrate_deploy=true` e registrar o estado de `validate` e do job dependente. Manter a execução claramente identificada como ensaio isolado. Nenhuma execução negativa foi disparada nesta etapa. [Issue](https://cinemax-projeto.atlassian.net/browse/KAN-18) · [Workflow](https://github.com/flavio-a-galvao/cinema-mobile/blob/7698933e2a6410d6f3adec1922dc6a962e408b51/.github/workflows/ci.yml)

## Ordem topológica do Jira

Camadas calculadas pelos vínculos Blocks. Épicos como agrupadores ficam fora da tabela. Estar sem dependências de entrada não equivale a aceite.

1. KAN-10, KAN-12, KAN-18, KAN-28, KAN-32, KAN-34.
2. KAN-16, KAN-19, KAN-21, KAN-27, KAN-33.
3. KAN-17, KAN-20, KAN-24.
4. KAN-13, KAN-15, KAN-30.
5. KAN-11.
6. KAN-14, KAN-23.
7. KAN-22, KAN-29.
8. KAN-26, KAN-31.
9. KAN-25.

KAN-34 segue aguardando revisão humana do PR #8. KAN-32 precisa de confirmação real das contas e dos papéis. KAN-25 tem dependências diretas KAN-21, KAN-22, KAN-24 e KAN-26. A integração da auditoria e seus diagramas só entra no escopo da versão caso o PR seja aprovado e incorporado. [PR #8](https://github.com/flavio-a-galvao/cinema-mobile/pull/8) · [KAN-25](https://cinemax-projeto.atlassian.net/browse/KAN-25)

Limites da rodada: não houve deploy de produção, coleta mensal de SLO, verificação de outras famílias de navegador ou reexecução do E2E completo de bilheteria. Os ensaios de bilheteria anteriores continuam válidos como evidência histórica. Nenhum status Jira, aceite, merge, tag ou release foi registrado.


## Riscos restantes para a matriz de 9 pontos

- **A1 e A3.** O registro visual cobre os diagramas, e o Swagger executou pelo Nginx real. KAN-28 aguarda o aceite do responsável. KAN-23 aguarda as dependências KAN-10, KAN-11, KAN-15 e KAN-17.
- **A5.** O CI da main está verde. A prova negativa observada permanece opcional para a matriz transcrita e deve ser feita em uma branch descartável se o avaliador ou o aceite da KAN-18 a exigirem.
- **B1 a B3.** Redis/cache e circulação Pub/Sub têm prova histórica real aplicável ao backend integrado. A rodada nova confirma topologia, TLS e inscrições, com escopo descrito acima. Se a etapa vigente exigir auditoria como processo independente na versão entregue, o PR #8 precisa de revisão humana e autorização de integração.
- **T1 e T3.** O Jira tem uso e histórico reais. A cadeia KAN-32 → KAN-27 → KAN-24 e os bloqueios técnicos ainda impedem o fechamento formal da KAN-25. Os snapshots versionados são incrementos reproduzíveis. A publicação da pré-release está pendente.
- **A2, A4, B4 e T2.** Permanecem sustentados pelo código, DDD, observabilidade, runbook e análise Cynefin. As metas de SLO seguem separadas das medições realizadas.

O relatório de 9 pontos usa os descritores transcritos no repositório. Confirme com o formulário vigente qualquer exigência adicional de release, deploy ou processo separado. [Matriz da rubrica](../../RELATORIO_FINAL_RUBRICA.md) · [Rascunho da pré-release](1.0.0-rc.1-rascunho.md)
