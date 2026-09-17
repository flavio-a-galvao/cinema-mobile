import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

/** Mantém os valores legados desconhecidos nulos; nunca presume inteira/meia. */
export async function ensureTicketPaymentSchema(db: Sequelize) {
  const qi = db.getQueryInterface();
  const columns = await qi.describeTable('ingressos');
  if (!columns.tipo_ingresso) await qi.addColumn('ingressos', 'tipo_ingresso', { type: DataTypes.ENUM('inteira', 'meia'), allowNull: true });
  if (!columns.valor_unitario) await qi.addColumn('ingressos', 'valor_unitario', { type: DataTypes.DECIMAL(6, 2), allowNull: true });
  const duplicates = await db.query('SELECT id_ingresso FROM pagamentos WHERE id_ingresso IS NOT NULL GROUP BY id_ingresso HAVING COUNT(*) > 1 LIMIT 1', { type: QueryTypes.SELECT });
  if (duplicates.length) throw new Error('Existem pagamentos duplicados. Reconcilie o histórico antes de criar o índice; nenhum pagamento foi apagado.');
  const indexes = await qi.showIndex('pagamentos') as unknown as { unique?: boolean; fields?: { attribute?: string }[] }[];
  if (!indexes.some(index => index.unique && index.fields?.length === 1 && index.fields[0].attribute === 'id_ingresso')) {
    await qi.addIndex('pagamentos', ['id_ingresso'], { unique: true, name: 'pagamentos_ingresso_unique' });
  }
  await db.query('UPDATE ingressos i JOIN pagamentos p ON p.id_ingresso = i.id_ingresso SET i.valor_unitario = p.valor WHERE i.valor_unitario IS NULL');
}
