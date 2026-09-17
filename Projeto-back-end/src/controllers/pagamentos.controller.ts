import sequelize from '../config/database';
import { Request, Response } from 'express';
import { UniqueConstraintError } from 'sequelize';
import Cliente from '../models/Cliente';
import Ingresso from '../models/Ingresso';
import Pagamento from '../models/Pagamento';

class PagamentosController {
  static async findAll(req: Request, res: Response) { return res.status(200).json(await Pagamento.findAll()); }
  static async getById(req: Request, res: Response) { return res.status(200).json(await Pagamento.findByPk(Number(req.params.id))); }
  static async create(req: Request, res: Response) {
    const email = String(req.authUser?.email || '').trim().toLowerCase();
    if (!email) return res.status(401).json({ message: 'Autenticação necessária.' });
    const id = Number(req.body.id_ingresso), method = req.body.metodo_pagamento;
    if (!Number.isSafeInteger(id) || id <= 0 || !['cartao', 'pix', 'dinheiro'].includes(method)) return res.status(400).json({ message: 'Ingresso ou forma de pagamento inválidos.' });
    try {
      const result = await sequelize.transaction(async transaction => {
        // Serializa pagamentos concorrentes e cancelamento do mesmo ingresso.
        const ticket = await Ingresso.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!ticket) return { status: 404, body: { message: 'Ingresso não encontrado.' } };
        const owner = await Cliente.findByPk(Number(ticket.get('id_cliente')), { transaction });
        if (String(owner?.get('email') || '').trim().toLowerCase() !== email) return { status: 403, body: { message: 'Você só pode pagar seus próprios ingressos.' } };
        if (ticket.get('status') === 'cancelado') return { status: 409, body: { message: 'Ingresso cancelado não pode receber pagamento.' } };
        if (await Pagamento.findOne({ where: { id_ingresso: id }, transaction, lock: transaction.LOCK.UPDATE })) return { status: 409, body: { message: 'Este ingresso já foi pago.' } };
        const snapshot = ticket.get('valor_unitario');
        const cents = Math.round(Number(snapshot) * 100);
        if (snapshot == null || !['inteira', 'meia'].includes(String(ticket.get('tipo_ingresso'))) || !Number.isSafeInteger(cents) || cents < 0) return { status: 409, body: { message: 'Ingresso antigo sem preço registrado. Cancele e selecione os ingressos novamente.' } };
        const payment = await Pagamento.create({ id_ingresso: id, valor: cents / 100, metodo_pagamento: method, data_pagamento: new Date() }, { transaction });
        return { status: 201, body: payment };
      });
      return res.status(result.status).json(result.body);
    } catch (error) {
      if (error instanceof UniqueConstraintError) return res.status(409).json({ message: 'Este ingresso já foi pago.' });
      throw error;
    }
  }
}
export default PagamentosController;
