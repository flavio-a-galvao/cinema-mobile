import { DataTypes, type Sequelize } from 'sequelize';
export async function ensureIngressosSchema(db: Sequelize): Promise<void> {
 const qi = db.getQueryInterface();
 const columns = await qi.describeTable('ingressos');
 if (!columns.status) await qi.addColumn('ingressos', 'status', { type: DataTypes.ENUM('ativo', 'cancelado'), allowNull: false, defaultValue: 'ativo' });
 if (!columns.cancelado_em) await qi.addColumn('ingressos', 'cancelado_em', { type: DataTypes.DATE, allowNull: true });
 if (!columns.ocupacao_ativa) await db.query("ALTER TABLE ingressos ADD COLUMN ocupacao_ativa TINYINT GENERATED ALWAYS AS (CASE WHEN status = 'ativo' THEN 1 ELSE NULL END) STORED");
 const indexes = await qi.showIndex('ingressos') as { name?: string }[];
 // Duplicidades anteriores impedem a evolução: não apagar histórico automaticamente.
 if (!indexes.some(index => index.name === 'ingressos_assento_ativo_unique')) await qi.addIndex('ingressos', ['id_sessao', 'id_assento', 'ocupacao_ativa'], { unique: true, name: 'ingressos_assento_ativo_unique' });
 const seatIndexes = await qi.showIndex('assentos') as { name?: string }[];
 if (!seatIndexes.some(index => index.name === 'assentos_sala_codigo_unique')) await qi.addIndex('assentos', ['id_sala', 'fila', 'numero'], { unique: true, name: 'assentos_sala_codigo_unique' });
}
