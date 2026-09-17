import { Request, Response } from 'express';
import { UniqueConstraintError } from 'sequelize';
import sequelize from '../config/database';
import Assento from '../models/Assento';
import Cliente from '../models/Cliente';
import Ingresso from '../models/Ingresso';
import Sessao from '../models/Sessao';

class TicketError extends Error { constructor(public status: number, message: string) { super(message); } }
const validId = (value: number) => Number.isSafeInteger(value) && value > 0;
const emailOf = (req: Request) => String(req.authUser?.email || '').trim().toLowerCase();
const serialize = (ticket: Ingresso) => ({ id_ingresso: Number(ticket.get('id_ingresso')), id_sessao: Number(ticket.get('id_sessao')), id_cliente: Number(ticket.get('id_cliente')), id_assento: Number(ticket.get('id_assento')), data_compra: ticket.get('data_compra'), tipo_ingresso: ticket.get('tipo_ingresso'), valor_unitario: ticket.get('valor_unitario'), status: ticket.get('status'), cancelado_em: ticket.get('cancelado_em') });
function replyError(error: unknown, res: Response) {
 if (error instanceof TicketError) return res.status(error.status).json({ message: error.message });
 if (error instanceof UniqueConstraintError) return res.status(409).json({ message: 'Um dos assentos já está ocupado.' });
 throw error;
}
class IngressosController {
 static async findAll(req: Request, res: Response) { return res.send(await Ingresso.findAll()); }
 static async getById(req: Request, res: Response) { return res.send(await Ingresso.findByPk(Number(req.params.id))); }
 static async occupancy(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!validId(id)) return res.status(400).json({ message: 'Sessão inválida.' });
  return res.json(await Ingresso.findAll({ attributes: ['id_assento'], where: { id_sessao: id, status: 'ativo' } }));
 }
 private static async createTickets(req: Request, res: Response, batch: boolean) {
  try {
   const email = emailOf(req);
   if (!email) throw new TicketError(401, 'Autenticação necessária.');
   const sessionId = Number(req.body.id_sessao), clientId = Number(req.body.id_cliente);
   const rawSeats: unknown = batch ? req.body.id_assentos : [req.body.id_assento];
   if (!Array.isArray(rawSeats) || !rawSeats.length || rawSeats.length > 10) throw new TicketError(400, 'Selecione de 1 a 10 assentos.');
   const seats = rawSeats.map(Number);
   if (!validId(sessionId) || !validId(clientId) || seats.some(id => !validId(id)) || new Set(seats).size !== seats.length) throw new TicketError(400, 'Sessão, cliente ou assentos inválidos.');
   if (batch && (!Number.isInteger(req.body.qtdInteira) || !Number.isInteger(req.body.qtdMeia) || req.body.qtdInteira < 0 || req.body.qtdMeia < 0 || req.body.qtdInteira + req.body.qtdMeia !== seats.length)) throw new TicketError(400, 'Quantidade de ingressos diferente dos assentos.');
   if (!batch && req.body.tipo_ingresso !== undefined && !['inteira', 'meia'].includes(req.body.tipo_ingresso)) throw new TicketError(400, 'Tipo de ingresso inválido.');
   const fullCount = batch ? req.body.qtdInteira : req.body.tipo_ingresso === 'meia' ? 0 : 1;
   const created = await sequelize.transaction(async transaction => {
    const session = await Sessao.findByPk(sessionId, { transaction, lock: transaction.LOCK.UPDATE });
    const client = await Cliente.findByPk(clientId, { transaction });
    if (!session || !client) throw new TicketError(400, 'Sessão ou cliente inválido.');
    if (String(client.get('email') || '').trim().toLowerCase() !== email) throw new TicketError(403, 'Cliente não pertence ao usuário autenticado.');
    const schedule = new Date(String(session.get('horario'))).getTime();
    if (!Number.isFinite(schedule) || schedule <= Date.now()) throw new TicketError(409, 'Esta sessão já começou ou está indisponível.');
    const fullCents = Math.round(Number(session.get('preco')) * 100);
    if (session.get('preco') == null || !Number.isSafeInteger(fullCents) || fullCents < 0 || fullCents > 999999) throw new TicketError(409, 'Preço da sessão indisponível.');
    const tickets: Ingresso[] = [];
    for (const seatId of seats) {
     const seat = await Assento.findByPk(seatId, { transaction });
     if (!seat || Number(seat.get('id_sala')) !== Number(session.get('id_sala'))) throw new TicketError(400, 'Assento não pertence à sala da sessão.');
     const occupied = await Ingresso.findOne({ where: { id_sessao: sessionId, id_assento: seatId, status: 'ativo' }, transaction, lock: transaction.LOCK.UPDATE });
     if (occupied) throw new TicketError(409, 'Assento já ocupado nesta sessão.');
     tickets.push(await Ingresso.create({ id_sessao: sessionId, id_cliente: clientId, id_assento: seatId, status: 'ativo', tipo_ingresso: tickets.length < fullCount ? 'inteira' : 'meia', valor_unitario: (tickets.length < fullCount ? fullCents : Math.round(fullCents / 2)) / 100 }, { transaction }));
    }
    return tickets;
   });
   return res.status(201).json(batch ? created.map(serialize) : serialize(created[0]));
  } catch (error) { return replyError(error, res); }
 }
 static async create(req: Request, res: Response) { return IngressosController.createTickets(req, res, false); }
 static async createBatch(req: Request, res: Response) { return IngressosController.createTickets(req, res, true); }
 static async cancel(req: Request, res: Response) {
  try {
   if (!emailOf(req)) throw new TicketError(401, 'Autenticação necessária.');
   const id = Number(req.params.id);
   if (!validId(id)) throw new TicketError(400, 'Ingresso inválido.');
   const result = await sequelize.transaction(async transaction => {
    const initial = await Ingresso.findByPk(id, { transaction });
    if (!initial) throw new TicketError(404, 'Ingresso não encontrado.');
    const owner = await Cliente.findByPk(Number(initial.get('id_cliente')), { transaction });
    if (String(owner?.get('email') || '').trim().toLowerCase() !== emailOf(req)) throw new TicketError(403, 'Você só pode cancelar seus próprios ingressos.');
    const session = await Sessao.findByPk(Number(initial.get('id_sessao')), { transaction, lock: transaction.LOCK.UPDATE });
    const ticket = await Ingresso.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!ticket) throw new TicketError(404, 'Ingresso não encontrado.');
    if (ticket.get('status') === 'cancelado') throw new TicketError(409, 'Ingresso já cancelado.');
    const schedule = new Date(String(session?.get('horario'))).getTime();
    if (!Number.isFinite(schedule) || schedule <= Date.now()) throw new TicketError(409, 'Não é possível cancelar uma sessão já iniciada.');
    await ticket.update({ status: 'cancelado', cancelado_em: new Date() }, { transaction });
    return ticket;
   });
   return res.json(serialize(result));
  } catch (error) { return replyError(error, res); }
 }
}
export default IngressosController;
