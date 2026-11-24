# KAN-26 — Retomada, cancelamento e identificação dos assentos

Em 24/11/2026, a validação usou a base `21c1904d4c7ef3fce7bce361fb92005e0d61f7dc` e a árvore web corrigida `7e2848340413909251a36a8380304952bb133caf` (commit `5f71862`).

## Antes e depois

| Caso | Falha registrada na auditoria anterior | Resultado da correção |
| --- | --- | --- |
| Retomada | Após novo login, a API retornava a pendência e o histórico não oferecia retomada. | O histórico abriu o checkout com o ID existente. Após recarregar a página, a API devolveu o mesmo assento B1 e o preço de R$ 12,51. O Pix simulado retornou 201. |
| Cancelamento | O histórico não oferecia ação e não exibia o status cancelado devolvido pela API. | O ingresso futuro e pago continuou elegível. Após confirmação, o PATCH retornou 200, a interface exibiu Cancelado e retirou a ação. Uma repetição via API retornou 409. O checkout recusou o ingresso cancelado. |
| Assentos | A1 e B1 exibiam apenas o número 1. Havia seis botões com o mesmo nome. | A1, A2, B1 e B2 tinham nomes distintos. B1 foi selecionado pelo teclado, apareceu no resumo, ficou ocupado após emissão e voltou a ficar disponível após cancelamento. |

As reproduções originais e a captura foram preservadas na branch local `codex/kan-26-auditoria-fluxo-web`, commit `e6e0163`. A tabela acima registra os três resultados anteriores sem incluir aquela branch no PR.

## Execução e banco

- Windows, Node 24.14.0, Chrome/Chromium 158.0.8127.88 headless. Build React de produção e API Express real em loopback. MySQL 9.1.0 descartável em Docker 29.5.3, inicializado com `banco.sql` e rotinas de schema. Dados sintéticos e uma sala de 48 assentos em sessão futura.
- Jest: **20 testes em 4 suítes**, incluindo 9 novos. Build web aprovado. Os testes Jest verificam as mensagens de 403, 404 e 409 com respostas simuladas do cliente API.
- E2E Chromium: **1/1**, sem falhas, pulos ou flakiness. Cadastro, login, emissão, logout antes do pagamento, novo login, retomada, recarga, Pix e cancelamento pela interface. A repetição do cancelamento foi enviada deliberadamente pela API e retornou 409.
- SQL após o E2E: ingresso **3**, sessão **5**, assento **105/B1**, status `cancelado`. O comprador sintético tinha um único ingresso. Havia **um pagamento** de R$ 12,51 via Pix e **zero ingressos ativos** para o mesmo assento na sessão.
- A suíte de concorrência da KAN-30 teve seis aprovações na mesma versão de backend na auditoria anterior. Esta alteração é web e reutiliza essa prova. Redis, Nginx/TLS, outros navegadores e o mobile não foram exercitados nesta rodada.

Para reproduzir, inicie um ambiente descartável com API e web na mesma origem. Provisione uma sessão futura de R$ 25,01 em uma sala de 48 assentos, sem reservas para o filme de teste. Use `CINEMAX_E2E_ISOLATED=1`, `E2E_BASE_URL` da instância e `E2E_KAN26_MOVIE_ID` do filme. Com o Chromium do Playwright instalado, execute `npx playwright test e2e/bilheteria.spec.ts --project=chromium` no front-end. Para usar o Google Chrome instalado, defina `E2E_CHROMIUM_CHANNEL=chrome`. O relatório inclui os IDs do ensaio e os status HTTP.

[Jira KAN-26](https://cinemax-projeto.atlassian.net/browse/KAN-26)

## Revisão do PR #10 — pagamento em outra aba

A revisão de 24/11/2026 partiu de `5f71862`. Na versão anterior, um pagamento já registrado em outra aba podia resultar em mensagem genérica ou deixar o botão de confirmação visível após um HTTP 409.

- Aba A e aba B abertas no mesmo ingresso. Quando B pagou antes da confirmação em A, A exibiu “Os ingressos selecionados já estão pagos”, removeu a ação e não enviou POST. A recarga manteve o mesmo resultado.
- Quando B pagou depois da última leitura de A, mas antes de o POST de A chegar ao servidor, a API real retornou 201 para B e 409 para A. A confirmou o pagamento em `/me/compras` e exibiu o aviso informativo. O Playwright controlou a ordem das requisições sem simular respostas da API.
- Consultas SQL no MySQL 9.1.0 descartável confirmaram **um pagamento por ingresso** para os dois casos. Chromium 158.0.8127.88 headless e Express real em loopback.
- O front-end da árvore `a4253dab69bd4b0e0ca31c59cfe8f4f01c332c9f` passou em **23 testes Jest** e no build. O E2E local do fluxo de bilheteria passou novamente, incluindo retomada e cancelamento de ingresso pago. A suíte de concorrência do backend não foi repetida nesta revisão.
