import { QueryTypes, Sequelize } from 'sequelize';
import { ROOM_CAPACITY } from '../constants/roomLayout';

type RoomRow = { id_sala: number; capacidade: number };
export async function normalizeRoomCapacity(db: Sequelize) {
  return db.transaction(async transaction => {
    // Mesmo bloqueio usado na edição e geração de assentos.
    const rooms = await db.query<RoomRow>('SELECT id_sala, capacidade FROM salas ORDER BY id_sala FOR UPDATE', { type: QueryTypes.SELECT, transaction });
    const normalized: number[] = [];
    const needsReview: { id_sala: number; assentos: number }[] = [];
    for (const room of rooms) {
      const seats = await db.query<{ id_assento: number }>('SELECT id_assento FROM assentos WHERE id_sala = :id FOR UPDATE', { replacements: { id: room.id_sala }, type: QueryTypes.SELECT, transaction });
      if (seats.length > ROOM_CAPACITY) {
        needsReview.push({ id_sala: room.id_sala, assentos: seats.length });
        continue;
      }
      if (Number(room.capacidade) === ROOM_CAPACITY) continue;
      await db.query('UPDATE salas SET capacidade = :capacity WHERE id_sala = :id', { replacements: { capacity: ROOM_CAPACITY, id: room.id_sala }, transaction });
      normalized.push(room.id_sala);
    }
    return { normalized, needsReview };
  });
}
