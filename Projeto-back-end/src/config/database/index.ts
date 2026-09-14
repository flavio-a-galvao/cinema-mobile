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
    logging: console.log,
    dialectOptions: {
      ssl: false,
    },
  }
);

export default sequelize;

// import { Sequelize } from "sequelize";
// import "dotenv/config";

// const sequelize = new Sequelize(
//     "cinema_db",
//     "root",
//     "1234",
//     {
//         host: 'localhost',
//         port: 3306,
//         dialect: 'mysql', // ou mysql
//         logging: true
//     }
// );

// export default sequelize;