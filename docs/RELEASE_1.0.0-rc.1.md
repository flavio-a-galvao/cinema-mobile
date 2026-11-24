# Notas propostas — Cinemax 1.0.0-rc.1

**Rascunho, sem tag, release ou SHA de lançamento escolhido.** A referência integrada atual é [`43380fe32682d9b04de9f3db74617fc5bbfc6abc`](https://github.com/flavio-a-galvao/cinema-mobile/commit/43380fe32682d9b04de9f3db74617fc5bbfc6abc). O SHA de lançamento será definido após as integrações aprovadas. A auditoria independente permanece na seção condicional do PR #8.

## Conteúdo presente na main de referência

- Catálogo público de filmes e sessões, paginação e pôster substituto local na Home e no catálogo. A [evidência da KAN-12](evidencias/kan-12-poster.md) separa o teste com MySQL do reteste controlado no navegador.
- Cadastro, JWT, controles de cliente/admin e gestão de catálogo e pôsteres. A bilheteria web integrada no PR #10 exibe códigos de assento, retoma o checkout pelo ingresso existente após novo login ou recarga e cancela ingressos elegíveis com liberação do assento. Em duas abas, o histórico confirmou um único pagamento por ingresso. O Pix é simulado. [KAN-26 e evidências](https://github.com/flavio-a-galvao/cinema-mobile/blob/43380fe32682d9b04de9f3db74617fc5bbfc6abc/docs/evidencias/kan-26-correcao-web.md)
- API Express/Sequelize/MySQL, contrato OpenAPI e Swagger, Redis cache-aside e eventos de filmes e sessões já publicados com Subscriber interno.
- Docker Compose com Nginx/HTTPS para demonstração e CI de testes e builds. Os testes e builds web/API passaram em `43380fe`. O job de deploy demonstrativo ficou `skipped`. [CI da main](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45433562530)

## Somente se o PR #8 for integrado

Processo de auditoria Node.js no perfil Compose `audit`, assinando o Pub/Sub existente e gravando no SQLite por `eventId`. A [prova Docker do PR](https://github.com/flavio-a-galvao/cinema-mobile/actions/runs/45119133610/job/137508631835) confirmou isolamento, deduplicação e recriação do consumidor com o volume preservado. Não há replay de eventos de uma desconexão. Há dependência do volume `audit-data`, sem retenção automática. Substitua o SHA do PR pelo SHA integrado quando verificado e acrescente o CI correspondente.

## Limites e histórico do ciclo de vida

A suíte web existente passou em 11 cenários Chromium em `21c1904`. O ensaio adicional de bilheteria passou com API real e MySQL 9.1 descartável no HEAD `5633ad8`, cuja árvore é idêntica à do squash `43380fe`. Os ensaios foram locais. Firefox/WebKit e TLS/Nginx ficaram fora da rodada de bilheteria. [Suíte anterior](evidencias/entrega-final/e2e-main-21c1904.json) · [Bilheteria e ensaio em duas abas](https://github.com/flavio-a-galvao/cinema-mobile/blob/43380fe32682d9b04de9f3db74617fc5bbfc6abc/docs/evidencias/kan-26-correcao-web.md)

O SLO de 30 dias continua como meta sem medição mensal. O CI comprova testes e builds. O deploy real permanece pendente. Os três snapshots confirmam incrementos versionados com checksums. A pré-release continua proposta. O aceite formal de KAN-26, KAN-29 e KAN-30 permanece pendente. [Snapshots](evidencias/complementacao/entregas.json) · [Aceites](gestao/ACEITES_TECNICOS.md#bilheteria--kan-29-kan-30-e-kan-26)

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
