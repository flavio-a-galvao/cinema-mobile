# Notas propostas — Cinemax 1.0.0-rc.1

**Rascunho, sem tag, release ou SHA de lançamento escolhido.** A referência integrada é `21c1904`. As notas finais devem apontar ao SHA exato da main, posterior a qualquer integração aprovada. A auditoria independente só entra no escopo entregue se o PR #8 for efetivamente integrado.

## Conteúdo presente na main de referência

- Catálogo público de filmes e sessões, paginação e pôster substituto local na Home e no catálogo. A [evidência da KAN-12](evidencias/kan-12-poster.md) separa o teste com MySQL do reteste controlado no navegador.
- Cadastro, JWT, controles de cliente/admin, gestão de catálogo e pôsteres, escolha de assento, emissão, pagamento simulado e cancelamento. O pagamento não representa liquidação externa.
- API Express/Sequelize/MySQL, contrato OpenAPI e Swagger, Redis cache-aside e eventos de filmes e sessões já publicados com Subscriber interno.
- Docker Compose com Nginx/HTTPS para demonstração e CI de testes e builds. A [main em 21c1904](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45118101224) tem CI verde; o job de deploy demonstrativo foi pulado.

## Somente se o PR #8 for integrado

Processo de auditoria Node.js no perfil Compose `audit`, assinando o Pub/Sub existente e gravando no SQLite por `eventId`. A [prova Docker do PR](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610/job/137508631835) confirmou isolamento, deduplicação e recriação do consumidor com o volume preservado. Não há replay de eventos de uma desconexão. Há dependência do volume `audit-data`, sem retenção automática. Substitua o SHA do PR pelo SHA integrado quando verificado e acrescente o CI correspondente.

## Limites e histórico do ciclo de vida

A [suíte web existente](evidencias/entrega-final/e2e-main-21c1904.json) passou nos 11 cenários Chromium em main 21c1904 com MySQL descartável. Checkout e pagamento no navegador, Firefox/WebKit e TLS/Nginx não foram testados nessa execução. SLO de 30 dias é meta sem medição mensal. O GitHub Actions não publica produção. Os [três snapshots de fontes](evidencias/complementacao/entregas.json) são evidência de incrementos versionados e checksums, sem tags ou releases publicadas. O projeto Jira tem uso real; as revisões e aceites têm estados próprios.

## Checklist antes de publicar

- [ ] Selecionar uma main com as alterações aprovadas e registrar o SHA imutável. Confirmar escopo decidido para a KAN-34.
- [ ] Conferir build, testes, prova Docker, limites do E2E e estado de aceite das issues. Relacionar links e separar evidência histórica de verificação do SHA escolhido.
- [ ] Revisar notas, documentação e artefatos de fonte. Gerar ou reconferir SHA-256 dos snapshots sem incluir segredos, certificados privados ou dados.
- [ ] Confirmar que `1.0.0-rc.1` está livre e que deve ser publicada como pré-release. Solicitar autorização específica para tag e release.
- [ ] Após autorização, criar a tag no SHA conferido, publicar como pré-release e verificar URL, SHA, artefatos e notas disponíveis. Vincular aos itens pertinentes somente quando autorizado.

Comandos de conferência, sem publicar:

```powershell
git fetch --no-tags origin main
git rev-parse origin/main
git ls-remote --tags origin refs/tags/1.0.0-rc.1
```
