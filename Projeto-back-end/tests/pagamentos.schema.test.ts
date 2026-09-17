import { describe,expect,it,vi } from 'vitest';
import { ensureTicketPaymentSchema } from '../src/utils/ensureTicketPaymentSchema';
function database(columns:object={},indexes:unknown[]=[],duplicates:unknown[]=[]){
 const qi={describeTable:vi.fn().mockResolvedValue(columns),addColumn:vi.fn(),showIndex:vi.fn().mockResolvedValue(indexes),addIndex:vi.fn()};
 const db={getQueryInterface:()=>qi,query:vi.fn().mockResolvedValue(duplicates)};return {qi,db};
}
describe('Migração de preços e pagamento único',()=>{
 it('adiciona snapshots nullable e índice único sem apagar histórico',async()=>{
  const {qi,db}=database();await ensureTicketPaymentSchema(db as any);
  expect(qi.addColumn).toHaveBeenCalledWith('ingressos','tipo_ingresso',expect.objectContaining({allowNull:true}));
  expect(qi.addColumn).toHaveBeenCalledWith('ingressos','valor_unitario',expect.objectContaining({allowNull:true}));
  expect(qi.addIndex).toHaveBeenCalledWith('pagamentos',['id_ingresso'],{unique:true,name:'pagamentos_ingresso_unique'});
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE i.valor_unitario IS NULL'));
  expect(db.query.mock.calls.some(([sql])=>/DELETE|DROP/i.test(sql))).toBe(false);
 });
 it('é idempotente',async()=>{const {qi,db}=database({tipo_ingresso:{},valor_unitario:{}},[{unique:true,fields:[{attribute:'id_ingresso'}]}]);await ensureTicketPaymentSchema(db as any);expect(qi.addColumn).not.toHaveBeenCalled();expect(qi.addIndex).not.toHaveBeenCalled();});
 it('interrompe diante de duplicados sem excluir pagamentos',async()=>{const {qi,db}=database({tipo_ingresso:{},valor_unitario:{}},[],[{id_ingresso:1}]);await expect(ensureTicketPaymentSchema(db as any)).rejects.toThrow('duplicados');expect(qi.addIndex).not.toHaveBeenCalled();expect(db.query).toHaveBeenCalledTimes(1);});
});
