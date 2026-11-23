# KAN-12 · Pôster substituto do catálogo web

Base: `66271730c33fdca8b741df5f16c83c57f524c187`. Branch: `fix/kan-12-poster-fallback`.

## Antes — falha observada

Em 22/11/2026, às 22h05 (São Paulo), o ensaio em MySQL 9.1 descartável aprovou 12 verificações HTTP do catálogo. A Home e `/produtos` exibiram o pôster local. Para um filme sem pôster, ambas pediram `https://i.imgur.com/8w1NikM.jpg`, receberam HTTP 403 e o Chrome registrou falha de decodificação. O relatório bruto anterior foi preservado.

## Correção

`CatalogPoster` mantém o `<img>`, o texto alternativo e as classes CSS das telas. A Home, a lista e o detalhe em `/produtos` usam o componente. Sem endereço, ou após um erro de carregamento, ele usa um SVG incluído no build. O SVG não tem uma nova tentativa de fallback. O campo `poster_url` e os contratos HTTP permanecem iguais.

## Depois — resultado observado

Em 23/11/2026, às 02h18 (São Paulo), Chrome headless 158.0.8127.37 abriu o build de produção, com o catálogo e os erros de imagem fornecidos por servidores HTTP locais de teste.

| Cenário | Home | `/produtos` |
|---|---|---|
| Pôster válido | PNG original exibido | PNG original exibido |
| Pôster ausente | SVG local exibido | SVG local exibido |
| Endereço malformado | SVG local exibido | SVG local exibido |
| Endereço retorna 404 | SVG local exibido | SVG local exibido |
| Endereço retorna 403 | SVG local exibido | SVG local exibido |

O detalhe de `/produtos` também exibiu o SVG depois de um 403. O navegador observou as respostas 403 e 404 deliberadas e nenhuma requisição ao Imgur nessas telas.

A suíte Jest do frontend passou com **11 testes em 3 suítes**, incluindo 6 casos novos do componente. O build de produção web passou. O Docker retornou HTTP 500 ao iniciar o engine, portanto o ensaio novo usou respostas controladas e não repetiu a integração MySQL. O resultado com MySQL pertence ao ensaio anterior.

Para reproduzir os testes e o build, execute `npm test -- --watchAll=false --runInBand` e `npm run build` em `Projeto-front-end`. Para verificar no navegador, use um catálogo de teste com pôster válido, nulo, endereço malformado e URLs que respondam 404 e 403. Confirme o recurso exibido e os status na aba Rede.

**Aceite Jira pendente.** A evidência fundamenta uma proposta de revisão técnica em KAN-12.
SHA-256 dos registros JSON locais

- Antes: 6e8edc0c1be8a928e1a4a3669e7843f1b2cc4e404e10a97a8f39898d2cd69dea
- Depois: 6428651d310fd94a03e76f3aa2e6e1794ea3afca37a9207ff6b8125e98e87b59
