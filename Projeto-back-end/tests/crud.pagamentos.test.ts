import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UniqueConstraintError } from 'sequelize';
import Controller from '../src/controllers/pagamentos.controller';
import db from '../src/config/database';
import Cliente from '../src/models/Cliente';
import Ingresso from '../src/models/Ingresso';
import Pagamento from '../src/models/Pagamento';
vi.mock('../src/config/database',()=>({default:{transaction:vi.fn()}}));
vi.mock('../src/models/Cliente',()=>({default:{findByPk:vi.fn()}}));
vi.mock('../src/models/Ingresso',()=>({default:{findByPk:vi.fn()}}));
vi.mock('../src/models/Pagamento',()=>({default:{findAll:vi.fn(),findByPk:vi.fn(),findOne:vi.fn(),create:vi.fn()}}));
const model=(data:Record<string,unknown>)=>({get:(key:string)=>data[key]});
const res=()=>({status:vi.fn().mockReturnThis(),json:vi.fn().mockReturnThis()});
const request=()=>({body:{id_ingresso:1,metodo_pagamento:'pix',valor:0.01,data_pagamento:'2000-01-01'},authUser:{id_usuario:1,email:'own@test.com',tipo_usuario:'cliente'}});
const tx={LOCK:{UPDATE:'UPDATE'}};
beforeEach(()=>{
 vi.resetAllMocks(); (db.transaction as any).mockImplementation(async(callback:any)=>callback(tx));
 (Cliente.findByPk as any).mockResolvedValue(model({email:'own@test.com'}));
 (Ingresso.findByPk as any).mockResolvedValue(model({id_cliente:1,status:'ativo',tipo_ingresso:'meia',valor_unitario:'12.51'}));
 (Pagamento.findOne as any).mockResolvedValue(null);(Pagamento.create as any).mockImplementation(async(data:any)=>({id_pagamento:1,...data}));
});
describe('Pagamento autoritativo',()=>{
 it('lista pagamentos na consulta administrativa',async()=>{(Pagamento.findAll as any).mockResolvedValue([]);const response=res();await Controller.findAll({} as any,response as any);expect(response.json).toHaveBeenCalledWith([]);});
 it('ignora valor/data do request e usa snapshot persistido',async()=>{
  const response=res();await Controller.create(request() as any,response as any);
  expect(response.status).toHaveBeenCalledWith(201);
  expect(Pagamento.create).toHaveBeenCalledWith({id_ingresso:1,metodo_pagamento:'pix',valor:12.51,data_pagamento:expect.any(Date)},{transaction:tx});
  expect(Ingresso.findByPk).toHaveBeenCalledWith(1,{transaction:tx,lock:'UPDATE'});
 });
 it('não autenticado recebe 401',async()=>{const response=res();await Controller.create({body:request().body} as any,response as any);expect(response.status).toHaveBeenCalledWith(401);expect(Pagamento.create).not.toHaveBeenCalled();});
 it.each(['cliente','admin'])('%s não paga ingresso de outro cliente',async role=>{const req=request();req.authUser.email='other@test.com';req.authUser.tipo_usuario=role;const response=res();await Controller.create(req as any,response as any);expect(response.status).toHaveBeenCalledWith(403);expect(Pagamento.create).not.toHaveBeenCalled();});
 it('ingresso inexistente recebe 404',async()=>{(Ingresso.findByPk as any).mockResolvedValue(null);const response=res();await Controller.create(request() as any,response as any);expect(response.status).toHaveBeenCalledWith(404);});
 it('cancelado não pode ser pago',async()=>{(Ingresso.findByPk as any).mockResolvedValue(model({id_cliente:1,status:'cancelado'}));const response=res();await Controller.create(request() as any,response as any);expect(response.status).toHaveBeenCalledWith(409);expect(Pagamento.create).not.toHaveBeenCalled();});
 it('não inventa preço para ingresso legado',async()=>{(Ingresso.findByPk as any).mockResolvedValue(model({id_cliente:1,status:'ativo'}));const response=res();await Controller.create(request() as any,response as any);expect(response.status).toHaveBeenCalledWith(409);expect(Pagamento.create).not.toHaveBeenCalled();});
 it('duplicado retorna 409 sem criar',async()=>{(Pagamento.findOne as any).mockResolvedValue({id_pagamento:1});const response=res();await Controller.create(request() as any,response as any);expect(response.status).toHaveBeenCalledWith(409);expect(Pagamento.create).not.toHaveBeenCalled();});
 it('constraint de duplicidade retorna 409',async()=>{(Pagamento.create as any).mockRejectedValue(new UniqueConstraintError({}));const response=res();await Controller.create(request() as any,response as any);expect(response.status).toHaveBeenCalledWith(409);});
 it('duas solicitações concorrentes sob bloqueio registram apenas uma vez',async()=>{
  let tail=Promise.resolve();let stored:unknown=null;
  (db.transaction as any).mockImplementation((callback:any)=>{const next=tail.then(()=>callback(tx));tail=next.then(()=>undefined);return next;});
  (Pagamento.findOne as any).mockImplementation(async()=>stored);
  (Pagamento.create as any).mockImplementation(async(data:any)=>stored={id_pagamento:1,...data});
  const a=res(),b=res();await Promise.all([Controller.create(request() as any,a as any),Controller.create(request() as any,b as any)]);
  expect([a.status.mock.calls[0][0],b.status.mock.calls[0][0]].sort()).toEqual([201,409]);expect(Pagamento.create).toHaveBeenCalledOnce();
 });
 it.each([{id_ingresso:0,metodo_pagamento:'pix'},{id_ingresso:1,metodo_pagamento:'boleto'}])('valida dados de pagamento',async body=>{const response=res();await Controller.create({...request(),body} as any,response as any);expect(response.status).toHaveBeenCalledWith(400);expect(Pagamento.create).not.toHaveBeenCalled();});
});

it('valor zero persistido continua válido para registro simulado',async()=>{
 (Ingresso.findByPk as any).mockResolvedValue(model({id_cliente:1,status:'ativo',tipo_ingresso:'inteira',valor_unitario:0}));
 const response=res();await Controller.create(request() as any,response as any);expect(response.status).toHaveBeenCalledWith(201);expect(Pagamento.create).toHaveBeenCalledWith(expect.objectContaining({valor:0}),expect.anything());
});
