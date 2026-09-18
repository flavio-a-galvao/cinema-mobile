import { describe, expect, it, vi } from 'vitest';
import { ensureIngressosSchema } from '../src/utils/ensureIngressosSchema';
import type { Sequelize } from 'sequelize';

describe('Schema de ocupação ativa', () => {
 it('cria status e restrição única que exclui cancelados', async () => {
  const qi = { describeTable: vi.fn().mockResolvedValue({}), addColumn: vi.fn(), showIndex: vi.fn().mockResolvedValue([]), addIndex: vi.fn() };
  const db = { getQueryInterface: () => qi, query: vi.fn() };
  await ensureIngressosSchema(db as unknown as Sequelize);
  expect(qi.addColumn).toHaveBeenCalledWith('ingressos','status',expect.objectContaining({allowNull:false,defaultValue:'ativo'}));
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining("CASE WHEN status = 'ativo' THEN 1 ELSE NULL END"));
  expect(qi.addIndex).toHaveBeenCalledWith('ingressos',['id_sessao','id_assento','ocupacao_ativa'],{unique:true,name:'ingressos_assento_ativo_unique'});
 });
 it('é idempotente para schema atualizado', async () => {
  const qi = { describeTable: vi.fn().mockResolvedValue({status:{},cancelado_em:{},ocupacao_ativa:{}}), addColumn:vi.fn(), showIndex:vi.fn().mockResolvedValue([{name:'ingressos_assento_ativo_unique'},{name:'assentos_sala_codigo_unique'}]),addIndex:vi.fn() };
  const db={getQueryInterface:()=>qi,query:vi.fn()};
  await ensureIngressosSchema(db as unknown as Sequelize);
  expect(qi.addColumn).not.toHaveBeenCalled(); expect(qi.addIndex).not.toHaveBeenCalled(); expect(db.query).not.toHaveBeenCalled();
 });
});
