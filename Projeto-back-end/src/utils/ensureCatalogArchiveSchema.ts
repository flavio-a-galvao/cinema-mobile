import { DataTypes, type QueryInterface } from 'sequelize';

export async function ensureCatalogArchiveSchema(queryInterface: QueryInterface): Promise<void> {
  for (const table of ['filmes', 'salas', 'sessoes', 'assentos']) {
    const columns = await queryInterface.describeTable(table);
    if (!columns.excluido_em) {
      await queryInterface.addColumn(table, 'excluido_em', { type: DataTypes.DATE, allowNull: true });
    }
  }
}
