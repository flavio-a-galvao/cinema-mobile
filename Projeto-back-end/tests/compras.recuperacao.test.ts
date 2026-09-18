import {beforeEach,describe,expect,it,vi} from 'vitest';
import {Op} from 'sequelize';
import Controller from '../src/controllers/compras.controller';
import Cliente from '../src/models/Cliente';
import Ingresso from '../src/models/Ingresso';
import Pagamento from '../src/models/Pagamento';
import Sessao from '../src/models/Sessao';
import Filme from '../src/models/Filme';
import Assento from '../src/models/Assento';
import Sala from '../src/models/Sala';
import {pendingCheckout} from '../../Projeto-mobile/utils/pendingCheckout';
vi.mock('../src/models/Cliente',()=>({default:{findAll:vi.fn()}}));
vi.mock('../src/models/Ingresso',()=>({default:{findAll:vi.fn(),create:vi.fn()}}));
vi.mock('../src/models/Pagamento',()=>({default:{findAll:vi.fn()}}));
vi.mock('../src/models/Sessao',()=>({default:{findAll:vi.fn()}}));
vi.mock('../src/models/Filme',()=>({default:{findAll:vi.fn()}}));
vi.mock('../src/models/Assento',()=>({default:{findAll:vi.fn()}}));
vi.mock('../src/models/Sala',()=>({default:{findAll:vi.fn()}}));
const model=(data:Record<string,unknown>)=>({get:(key:string)=>data[key]});
const response=()=>({status:vi.fn().mockReturnThis(),json:vi.fn().mockReturnThis()});
const ticket={id_ingresso:10,id_cliente:7,id_assento:3,id_sessao:2,status:'ativo',tipo_ingresso:'meia',valor_unitario:'12.51',data_compra:new Date('2026-09-16T14:00:00Z')};
beforeEach(()=>{
 vi.resetAllMocks();(Cliente.findAll as any).mockResolvedValue([model({id_cliente:7})]);(Ingresso.findAll as any).mockResolvedValue([model(ticket)]);
 (Pagamento.findAll as any).mockResolvedValue([]);(Sessao.findAll as any).mockResolvedValue([model({id_sessao:2,id_filme:1,id_sala:4,horario:new Date('2099-01-01T22:00:00Z')})]);
 (Filme.findAll as any).mockResolvedValue([model({id_filme:1,titulo:'Cinemax'})]);(Sala.findAll as any).mockResolvedValue([model({id_sala:4,nome:'Sala Coral'})]);(Assento.findAll as any).mockResolvedValue([model({id_assento:3,fila:'A',numero:2})]);
});
async function purchases(){const res=response();await Controller.findMyPurchases({authUser:{email:'own@test.com'}} as any,res as any);return res.json.mock.calls[0][0];}
describe('Compras próprias e recuperação',()=>{
 it('consulta somente Cliente do JWT e seus ingressos',async()=>{
  await purchases();expect(Cliente.findAll).toHaveBeenCalledWith({where:{email:'own@test.com'}});
  expect(Ingresso.findAll).toHaveBeenCalledWith({where:{id_cliente:{[Op.in]:[7]}},order:[['data_compra','DESC']]});
 });
 it('conta sem Cliente não recebe ingressos alheios',async()=>{(Cliente.findAll as any).mockResolvedValue([]);expect(await purchases()).toEqual([]);expect(Ingresso.findAll).not.toHaveBeenCalled();});
 it('recupera preço/tipo persistidos sem recriar ingresso nem depender da memória',async()=>{
  const [item]=await purchases();expect(item).toMatchObject({id:10,pago:false,podePagar:true,valor_unitario:12.51,tipo_ingresso:'meia',assento:'A2'});
  const checkout=pendingCheckout(item,99);expect(checkout.tickets[0]).toMatchObject({id_ingresso:10,id_cliente:7,valor_unitario:12.51});expect(checkout.qtdMeia).toBe(1);expect(checkout.halfCents).toBe(1251);expect(Ingresso.create).not.toHaveBeenCalled();
 });
 it('horário e datas são ISO explícitos, sem formatação do container',async()=>{
  const [item]=await purchases();expect(item.sessao).toBe('2099-01-01T22:00:00.000Z');expect(item.horario).toBe(item.sessao);expect(item.dataCompra).toBe('2026-09-16T14:00:00.000Z');
  expect(new Date(item.horario).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'})).toBe('19:00');
 });
 it('pagamento registrado não pode ser recuperado para nova cobrança',async()=>{
  (Pagamento.findAll as any).mockResolvedValue([model({id_ingresso:10,id_pagamento:20,valor:'12.51',metodo_pagamento:'pix'})]);
  const [item]=await purchases();expect(item.pago).toBe(true);expect(item.podePagar).toBe(false);expect(()=>pendingCheckout(item,99)).toThrow();
 });
 it.each([{...ticket,status:'cancelado'},{...ticket,valor_unitario:null,tipo_ingresso:null}])('não libera pagamento cancelado/legado sem preço',async value=>{(Ingresso.findAll as any).mockResolvedValue([model(value)]);const [item]=await purchases();expect(item.podePagar).toBe(false);expect(()=>pendingCheckout(item,99)).toThrow();});
});
