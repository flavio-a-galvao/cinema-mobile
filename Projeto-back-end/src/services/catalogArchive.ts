import { Op, type Transaction } from 'sequelize';
import Ingresso from '../models/Ingresso';
import Pagamento from '../models/Pagamento';
import Sessao from '../models/Sessao';
import { catalogCache } from './catalogCache';
import { catalogEvents } from './catalogEvents';

export class CatalogSaleConflict extends Error {
  constructor() { super('Não é possível excluir: há ingressos vendidos no histórico.'); }
}

export function isCatalogLockConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { original?: { code?: string } }).original?.code;
  return code === 'ER_LOCK_DEADLOCK' || code === 'ER_LOCK_WAIT_TIMEOUT';
}

export async function archiveSessions(sessions: Sessao[], transaction: Transaction): Promise<number[]> {
  const ids = sessions.map(session => session.id_sessao);
  if (!ids.length) return ids;

  // A emissão trava a sessão. O pagamento trava o ingresso antes de gravar.
  const tickets = await Ingresso.findAll({
    attributes: ['id_ingresso'],
    where: { id_sessao: { [Op.in]: ids } },
    order: [['id_ingresso', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (tickets.length) {
    const ticketIds = tickets.map(ticket => ticket.id_ingresso);
    const payment = await Pagamento.findOne({
      attributes: ['id_pagamento'],
      where: { id_ingresso: { [Op.in]: ticketIds } },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (payment) throw new CatalogSaleConflict();

    await Ingresso.update({ status: 'cancelado', cancelado_em: new Date() }, {
      where: { id_ingresso: { [Op.in]: ticketIds }, status: 'ativo' },
      transaction,
    });
  }

  await Sessao.destroy({ where: { id_sessao: { [Op.in]: ids } }, transaction });
  return ids;
}

export async function publishArchivedSessions(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await catalogCache.invalidate('sessoes');
  for (const id of ids) await catalogEvents.publish('sessao.deleted', id);
}
