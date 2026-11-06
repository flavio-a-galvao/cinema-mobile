import { Sequelize } from 'sequelize';
import "dotenv/config";

// Define the database connection configuration
const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE;
const dbUser = process.env.DB_USER || process.env.MYSQL_USER;
const dbPass = process.env.DB_PASS || process.env.MYSQL_PASSWORD;
const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306');

if (!dbName || !dbUser || !dbPass) {
  throw new Error('Database credentials are required. Set DB_NAME, DB_USER, and DB_PASS in the environment.');
}

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPass,
  {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    // SQL e parâmetros podem conter dados pessoais: não registrar consultas cruas.
    logging: false,
    pool: { max: 5, min: 0, acquire: 5000, idle: 10000 },
    // Repetir uma escrita após timeout pode duplicar efeitos; retry só no startup seguro.
    retry: { max: 0 },
    dialectOptions: {
      ssl: false,
      connectTimeout: 5000,
    },
  }
);

export default sequelize;
