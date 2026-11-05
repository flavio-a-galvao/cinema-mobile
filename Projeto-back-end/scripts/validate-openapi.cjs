const path = require('node:path');
const SwaggerParser = require('@apidevtools/swagger-parser');

const file = path.resolve(__dirname, '../src/docs/openapi.json');
SwaggerParser.validate(file, { resolve: { external: false } })
  .then(api => {
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
    const operations = Object.values(api.paths).reduce((total, item) =>
      total + Object.keys(item).filter(key => methods.includes(key)).length, 0);
    console.log(`OpenAPI ${api.openapi} válido: ${Object.keys(api.paths).length} caminhos, ${operations} operações.`);
  })
  .catch(error => { console.error(error.message); process.exitCode = 1; });
