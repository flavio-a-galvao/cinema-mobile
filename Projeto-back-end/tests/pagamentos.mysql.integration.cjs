// Executar após o build no ambiente MySQL configurado: node --test tests/pagamentos.mysql.integration.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const db = require('../dist/config/database').default;
const app = require('../dist/app').default;
const { JWT_SECRET } = require('../dist/config/auth');
const { ensureTicketPaymentSchema } = require('../dist/utils/ensureTicketPaymentSchema');
const models = Object.fromEntries(['Cliente','User','Sala','Assento','Filme','Sessao','Ingresso','Pagamento'].map(name=>[name,require('../dist/models/'+name).default]));
db.options.logging=false;

test('Integração MySQL: isolamento, preço, recuperação e concorrência', async t => {
 let server; const fixtures=[]; let client,session,tickets=[];
 async function fixture(name,values){const record=await models[name].create(values);fixtures.push(record);return record;}
 try {
  await db.authenticate();
  await ensureTicketPaymentSchema(db); await ensureTicketPaymentSchema(db);
  const tag=randomUUID();
  const user=await fixture('User',{nome:'Teste de segurança',email:tag+'@test.invalid',senha:'HASH_TESTE_NAO_RETORNAR',tipo_usuario:'cliente'});
  client=await fixture('Cliente',{nome:'Teste de segurança',email:user.email});
  const movie=await fixture('Filme',{titulo:'Teste isolado de pagamento'});
  const room=await fixture('Sala',{nome:'Sala teste temporária',capacidade:2});
  const seats=[];for(let numero=1;numero<=2;numero++)seats.push(await fixture('Assento',{id_sala:room.id_sala,fila:'A',numero}));
  session=await fixture('Sessao',{id_filme:movie.id_filme,id_sala:room.id_sala,horario:new Date('2099-01-01T22:00:00Z'),preco:25.01});
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const token=jwt.sign({id_usuario:user.id_usuario,email:user.email,tipo_usuario:'cliente'},JWT_SECRET,{expiresIn:'5m'});
  const other=jwt.sign({id_usuario:user.id_usuario+100000,email:tag+'other@test.invalid',tipo_usuario:'cliente'},JWT_SECRET,{expiresIn:'5m'});
  const admin=jwt.sign({id_usuario:user.id_usuario,email:user.email,tipo_usuario:'admin'},JWT_SECRET,{expiresIn:'5m'});
  async function call(path,method='GET',body,auth=token){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json()};}
  await t.test('usuários e aliases sem exposição de senha/hash',async()=>{
   for(const path of ['/users','/usuarios']){
    assert.equal((await call(path,'GET',undefined,null)).status,401);
    assert.equal((await call(path)).status,403);
    const list=await call(path,'GET',undefined,admin);assert.equal(list.status,200);assert(!JSON.stringify(list.body).includes('senha'));assert(!JSON.stringify(list.body).includes('HASH_TESTE_NAO_RETORNAR'));
    const own=await call(path+'/'+user.id_usuario);assert.equal(own.status,200);assert(!JSON.stringify(own.body).includes('senha'));
    assert.equal((await call(path+'/'+user.id_usuario,'GET',undefined,other)).status,403);
   }
  });
  await t.test('lote salva preços reais e ocupação só expõe assentos',async()=>{
   const result=await call('/ingressos/lote','POST',{id_sessao:session.id_sessao,id_cliente:client.id_cliente,id_assentos:seats.map(seat=>seat.id_assento),qtdInteira:1,qtdMeia:1,valor_unitario:0.01});
   assert.equal(result.status,201);tickets=result.body;assert.deepEqual(tickets.map(ticket=>Number(ticket.valor_unitario)),[25.01,12.51]);
   const occupancy=await call('/sessoes/'+session.id_sessao+'/ocupacao');assert.equal(occupancy.body.length,2);assert(occupancy.body.every(seat=>Object.keys(seat).join(',')==='id_assento'));
   assert.equal((await call('/ingressos')).status,403);assert.deepEqual((await call('/me/compras','GET',undefined,other)).body,[]);
  });
  await t.test('pendência é recuperável sem recriar ingresso e data é ISO',async()=>{
   const count=await models.Ingresso.count({where:{id_cliente:client.id_cliente}});
   const mine=await call('/me/compras');assert.equal(mine.body.length,2);assert(mine.body.every(item=>item.podePagar && !item.pago));assert.equal(mine.body[0].horario,'2099-01-01T22:00:00.000Z');
   await call('/me/compras');assert.equal(await models.Ingresso.count({where:{id_cliente:client.id_cliente}}),count);
  });
  await t.test('duas requisições simultâneas: 201/409, valor não manipulável',async()=>{
   assert.equal(tickets.length,2);
   const payload={id_ingresso:tickets[1].id_ingresso,metodo_pagamento:'pix',valor:0.01};
   assert.equal((await call('/pagamentos','POST',payload,other)).status,403);
   const results=await Promise.all([call('/pagamentos','POST',payload),call('/pagamentos','POST',payload)]);
   assert.deepEqual(results.map(result=>result.status).sort(),[201,409]);
   assert.equal(Number(results.find(result=>result.status===201).body.valor),12.51);
   assert.equal(await models.Pagamento.count({where:{id_ingresso:payload.id_ingresso}}),1);
   assert.equal((await call('/pagamentos','POST',payload)).status,409);
   await assert.rejects(models.Pagamento.create({...payload,valor:12.51}),error=>error.name==='SequelizeUniqueConstraintError');
   const own=(await call('/me/compras')).body;assert.equal(own.find(item=>item.id===payload.id_ingresso).podePagar,false);assert.equal(own.filter(item=>item.podePagar).length,1);
  });
 } finally {
  if(server)await new Promise(resolve=>server.close(resolve));
  // Apaga exclusivamente os registros criados por este teste, preservando dados anteriores.
  if(client){const records=await models.Ingresso.findAll({where:{id_cliente:client.id_cliente}});for(const record of records){await models.Pagamento.destroy({where:{id_ingresso:record.id_ingresso}});await record.destroy();}}
  for(const record of fixtures.reverse())await record.destroy();
  await db.close();
 }
});
