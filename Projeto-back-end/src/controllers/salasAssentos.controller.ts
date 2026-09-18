import { ROOM_CAPACITY } from '../constants/roomLayout';
import type { Request, Response } from 'express';
import sequelize from '../config/database';
import Sala from '../models/Sala';
import Assento from '../models/Assento';
class SeatGenerationError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function generateRoomSeats(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: 'Sala inválida.' });
  try {
    const result = await sequelize.transaction(async transaction => {
      // Serializa gerações simultâneas e alterações de capacidade da mesma sala.
      const room = await Sala.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!room) throw new SeatGenerationError(404, 'Sala não encontrada.');
      const seats = await Assento.findAll({ where: { id_sala: id }, transaction });
      const existing = new Set(seats.map(seat => String(seat.fila ?? '').trim().toUpperCase() + ':' + String(seat.numero ?? '').trim()));
      const missing: { id_sala: number; fila: string; numero: string }[] = [];
      for (const fila of 'ABCDEF') for (let numero = 1; numero <= 8; numero++) {
        if (!existing.has(fila + ':' + numero)) missing.push({ id_sala: id, fila, numero: String(numero) });
      }
      if (seats.length + missing.length > ROOM_CAPACITY) throw new SeatGenerationError(409, 'Esta sala possui assentos incompatíveis com o mapa de 48 lugares. Revise o cadastro; nenhum assento será apagado.');
      if (room.capacidade !== ROOM_CAPACITY) await room.update({ capacidade: ROOM_CAPACITY }, { transaction });
      if (missing.length) await Assento.bulkCreate(missing, { transaction, ignoreDuplicates: true });
      const total = await Assento.count({ where: { id_sala: id }, transaction });
      return { criados: total - seats.length, total };
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof SeatGenerationError) return res.status(error.status).json({ message: error.message });
    throw error;
  }
}
