import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UniqueConstraintError } from 'sequelize';
import Controller from '../src/controllers/ingressos.controller';
import db from '../src/config/database';
import Assento from '../src/models/Assento';
import Cliente from '../src/models/Cliente';
import Ingresso from '../src/models/Ingresso';
import Sessao from '../src/models/Sessao';

vi.mock('../src/config/database', () => ({ default: { transaction: vi.fn() } }));
vi.mock('../src/models/Ingresso', () => ({ default: { findAll: vi.fn(), findByPk: vi.fn(), findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../src/models/Sessao', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../src/models/Cliente', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../src/models/Assento', () => ({ default: { findByPk: vi.fn() } }));
const transaction = { LOCK: { UPDATE: 'UPDATE' } };
function model(values: Record<string, unknown>) {
 return { get: vi.fn((key: string) => values[key]), update: vi.fn(async (next: object) => Object.assign(values, next)) };
}
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis() });
const request = (ids = [1,2,3]) => ({ body: { id_sessao: 1, id_cliente: 1, id_assento: 1, id_assentos: ids, qtdInteira: ids.length, qtdMeia: 0 }, params: { id: '10' }, authUser: { id_usuario: 99, email: 'user@mail.com', tipo_usuario: 'cliente' } });
let ticket: ReturnType<typeof model>;
beforeEach(() => {
 vi.resetAllMocks();
 (db.transaction as any).mockImplementation(async (callback: any) => callback(transaction));
 (Sessao.findByPk as any).mockResolvedValue(model({ id_sala: 1, preco: '25.01', horario: '2099-01-01T19:00:00Z' }));
 (Cliente.findByPk as any).mockResolvedValue(model({ email: 'user@mail.com' }));
 (Assento.findByPk as any).mockResolvedValue(model({ id_sala: 1 }));
 (Ingresso.findOne as any).mockResolvedValue(null);
 (Ingresso.create as any).mockImplementation(async (values: object) => model({ ...values, id_ingresso: 10 }));
 ticket = model({ id_ingresso: 10, id_sessao: 1, id_cliente: 1, id_assento: 1, status: 'ativo' });
 (Ingresso.findByPk as any).mockResolvedValue(ticket);
});
describe('Compra de ingressos', () => {
 it('mantém listagem existente', async () => { (Ingresso.findAll as any).mockResolvedValue([]); const res=response(); await Controller.findAll({} as any,res as any); expect(res.send).toHaveBeenCalledWith([]); });
 it('mantém criação individual', async () => { const res=response(); await Controller.create(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(201); expect(Ingresso.create).toHaveBeenCalledTimes(1); });
 it('cria três ingressos para três assentos na mesma transação', async () => {
  const res=response(); await Controller.createBatch(request() as any,res as any);
  expect(res.status).toHaveBeenCalledWith(201); expect(Ingresso.create).toHaveBeenCalledTimes(3);
  expect((Ingresso.create as any).mock.calls.map((call: any) => call[0].id_assento)).toEqual([1,2,3]);
  expect((Ingresso.create as any).mock.calls.every((call: any) => call[1].transaction === transaction)).toBe(true);
  expect(Sessao.findByPk).toHaveBeenCalledWith(1, { transaction, lock: 'UPDATE' });
 });
 it('aceita o limite de dez', async () => { const res=response(); await Controller.createBatch(request(Array.from({ length:10 },(_,i)=>i+1)) as any,res as any); expect(res.status).toHaveBeenCalledWith(201); });
 it.each([{ids:[]}, {ids:[1,1]}, {ids:Array.from({ length:11 },(_,i)=>i+1)}])('recusa quantidade/assentos inválidos $ids', async ({ids}) => { const res=response(); await Controller.createBatch(request(ids) as any,res as any); expect(res.status).toHaveBeenCalledWith(400); expect(Ingresso.create).not.toHaveBeenCalled(); });
 it('valida inteira + meia', async () => { const req=request(); req.body.qtdMeia=1; const res=response(); await Controller.createBatch(req as any,res as any); expect(res.status).toHaveBeenCalledWith(400); });
 it('não aceita cliente de outra conta', async () => { (Cliente.findByPk as any).mockResolvedValue(model({ email: 'outro@mail.com' })); const res=response(); await Controller.createBatch(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(403); });
 it('recusa dependências ausentes', async () => { (Sessao.findByPk as any).mockResolvedValue(null); const res=response(); await Controller.create(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(400); });
 it('recusa assento de outra sala', async () => { (Assento.findByPk as any).mockResolvedValue(model({ id_sala: 2 })); const res=response(); await Controller.createBatch(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(400); });
 it('recusa assento já ativo', async () => { (Ingresso.findOne as any).mockResolvedValue(ticket); const res=response(); await Controller.createBatch(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(409); expect(Ingresso.create).not.toHaveBeenCalled(); });
 it('converte conflito da restrição do banco em 409', async () => { (Ingresso.create as any).mockRejectedValue(new UniqueConstraintError({})); const res=response(); await Controller.createBatch(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(409); });
});
describe('Cancelamento e ocupação', () => {
 it('só permite cancelar ao dono', async () => { (Cliente.findByPk as any).mockResolvedValue(model({ email:'outro@mail.com' })); const res=response(); await Controller.cancel(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(403); expect(ticket.update).not.toHaveBeenCalled(); });
 it('bloqueia usuário sem autenticação', async () => { const res=response(); await Controller.cancel({ params:{ id:'10' } } as any,res as any); expect(res.status).toHaveBeenCalledWith(401); });
 it('preserva histórico e recusa segundo cancelamento', async () => { await Controller.cancel(request() as any,response() as any); expect(ticket.update).toHaveBeenCalledWith({ status:'cancelado', cancelado_em:expect.any(Date) },{transaction}); const res=response(); await Controller.cancel(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(409); expect(ticket.update).toHaveBeenCalledTimes(1); });
 it('bloqueia sessão passada', async () => { (Sessao.findByPk as any).mockResolvedValue(model({ horario:'2000-01-01', id_sala:1 })); const res=response(); await Controller.cancel(request() as any,res as any); expect(res.status).toHaveBeenCalledWith(409); expect(ticket.update).not.toHaveBeenCalled(); });
 it('cancelado deixa de ocupar e permite nova criação', async () => {
  await Controller.cancel(request() as any,response() as any);
  (Ingresso.findOne as any).mockImplementation(async ({where}: any) => ticket.get('status') === where.status ? ticket : null);
  const res=response(); await Controller.create(request() as any,res as any);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(Ingresso.findOne).toHaveBeenCalledWith(expect.objectContaining({ where:{ id_sessao:1,id_assento:1,status:'ativo' } }));
  await Controller.occupancy({params:{id:'1'}} as any,response() as any);
  expect(Ingresso.findAll).toHaveBeenCalledWith({ attributes:['id_assento'],where:{id_sessao:1,status:'ativo'} });
 });
});

it('persiste inteira/meia e preço autoritativo arredondado ignorando valores enviados', async () => {
 const req = request([1,2]); req.body.qtdInteira=1; req.body.qtdMeia=1;
 Object.assign(req.body, { valor_unitario: 0.01, preco: 0.01, valor: 0.01 });
 const res=response(); await Controller.createBatch(req as any,res as any);
 expect(res.status).toHaveBeenCalledWith(201);
 expect(Ingresso.create).toHaveBeenNthCalledWith(1,expect.objectContaining({tipo_ingresso:'inteira',valor_unitario:25.01}),expect.anything());
 expect(Ingresso.create).toHaveBeenNthCalledWith(2,expect.objectContaining({tipo_ingresso:'meia',valor_unitario:12.51}),expect.anything());
 expect(res.json.mock.calls[0][0].map((item:any)=>item.valor_unitario)).toEqual([25.01,12.51]);
});

it('preserva sessão gratuita com preço zero explícito',async()=>{
 (Sessao.findByPk as any).mockResolvedValue(model({id_sala:1,preco:'0.00',horario:'2099-01-01T19:00:00Z'}));
 const res=response();await Controller.create(request([1]) as any,res as any);expect(res.status).toHaveBeenCalledWith(201);expect(Ingresso.create).toHaveBeenCalledWith(expect.objectContaining({valor_unitario:0}),expect.anything());
});
