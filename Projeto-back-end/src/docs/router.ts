import express, { Router } from 'express';
import path from 'node:path';
import specification from './openapi.json';

const docs = Router();
const assetsDirectory = path.dirname(require.resolve('swagger-ui-dist/package.json'));

// URLs relativas preservam /api/ quando o Nginx remove o prefixo antes da API.
const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cinemax — documentação da API</title>
  <link rel="stylesheet" href="./assets/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="./assets/swagger-ui-bundle.js"></script>
  <script src="./swagger-initializer.js"></script>
</body>
</html>`;

const initializer = `window.addEventListener('load', function () {
  window.ui = SwaggerUIBundle({
    url: './openapi.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    validatorUrl: null,
    persistAuthorization: false,
    queryConfigEnabled: false,
    showExtensions: true,
    presets: [SwaggerUIBundle.presets.apis]
  });
});`;

docs.get('/', (req, res) => {
  if (!req.originalUrl.split('?')[0].endsWith('/')) {
    // Location relativa também funciona em /api/api-docs, sem confiar em headers.
    return res.redirect(308, 'api-docs/');
  }
  return res.type('html').send(html);
});
docs.get('/openapi.json', (_req, res) => res.json(specification));
docs.get('/swagger-initializer.js', (_req, res) => res.type('application/javascript').send(initializer));
docs.use('/assets', express.static(assetsDirectory, { index: false, dotfiles: 'deny' }));

export default docs;
