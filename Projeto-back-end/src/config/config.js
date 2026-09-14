/**
 * ⚠️ DEPRECATED - Este arquivo foi DESCONTINUADO
 * 
 * Motivo: Continha senhas hardcoded que violam práticas de segurança
 * 
 * Solução: Use variáveis de ambiente em database/index.ts
 * 
 * Ver: SECURITY.md para documentação completa de segurança
 */

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '1234',
    database: process.env.DB_NAME || 'filmes_2026',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
  },
};