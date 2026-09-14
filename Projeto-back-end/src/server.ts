import app from "./app";
import sequelize from "./config/database";
import { DataTypes } from "sequelize";

const port = 3000;

interface IndexField {
  attribute?: string;
}

interface IndexMetadata {
  unique?: boolean;
  fields?: IndexField[];
}

async function ensureUsuariosCpfColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const tableDescription = await queryInterface.describeTable("usuarios");

  if (!Object.prototype.hasOwnProperty.call(tableDescription, "cpf")) {
    await queryInterface.addColumn("usuarios", "cpf", {
      type: DataTypes.STRING(14),
      allowNull: true,
    });
  }

  const indexesRaw = await queryInterface.showIndex("usuarios");
  const indexes: IndexMetadata[] = Array.isArray(indexesRaw) ? (indexesRaw as IndexMetadata[]) : [];
  const hasUniqueCpfIndex = indexes.some((index) => {
    const fields = Array.isArray(index.fields)
      ? index.fields.map((field) => String(field.attribute || ""))
      : [];
    return index.unique === true && fields.includes("cpf");
  });

  if (!hasUniqueCpfIndex) {
    await queryInterface.addIndex("usuarios", ["cpf"], {
      unique: true,
      name: "usuarios_cpf_unique",
    });
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log('Banco de dados disponível após', attempt, 'tentativa(s).');
      return;
    } catch (error) {
      console.warn(`Tentativa ${attempt}/${retries} falhou: o banco ainda não está pronto.`);
      if (attempt === retries) {
        throw error;
      }
      await sleep(delayMs);
    }
  }
}

async function startServer() {
  try {
    await waitForDatabase();
    await ensureUsuariosCpfColumn();
    await sequelize.sync();

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
}

startServer();