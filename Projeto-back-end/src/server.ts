import { normalizeRoomCapacity } from './utils/normalizeRoomCapacity';
import { ensureTicketPaymentSchema } from './utils/ensureTicketPaymentSchema';
import { ensureIngressosSchema } from './utils/ensureIngressosSchema';
import app from "./app";
import sequelize from "./config/database";
import { DataTypes } from "sequelize";
import { ensureClientesEmailUnique } from "./utils/ensureClientesEmailUnique";
import { catalogEvents } from './services/catalogEvents';
import { catalogCache } from './services/catalogCache';
import { errorMetadata, log } from './services/logger';
import { waitForDatabase } from './services/databaseReadiness';

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

async function startServer() {
  try {
    await waitForDatabase(() => sequelize.authenticate());
    await ensureUsuariosCpfColumn();
    await ensureClientesEmailUnique(sequelize.getQueryInterface());
    await ensureIngressosSchema(sequelize);
    await ensureTicketPaymentSchema(sequelize);
    await sequelize.sync();
    const roomReport = await normalizeRoomCapacity(sequelize);
    if (roomReport.needsReview.length) log('warn', 'database', 'rooms_need_review', { count: roomReport.needsReview.length });

    const server = app.listen(port, () => {
      log('info', 'runtime', 'http_started', { port });
    });
    catalogEvents.start();

    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      log('info', 'runtime', 'shutdown_started');
      const deadline = setTimeout(() => {
        log('error', 'runtime', 'shutdown_deadline');
        catalogEvents.stop();
        catalogCache.close();
        process.exit(1);
      }, 10000).unref();
      // Drena requisições antes de fechar as conexões usadas pelas mutações.
      server.close(async () => {
        catalogEvents.stop();
        catalogCache.close();
        try { await sequelize.close(); }
        catch (error) { log('error', 'database', 'shutdown_failed', errorMetadata(error)); process.exitCode = 1; }
        finally { clearTimeout(deadline); }
      });
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  } catch (error) {
    log('error', 'runtime', 'startup_failed', errorMetadata(error));
    process.exit(1);
  }
}

startServer();
