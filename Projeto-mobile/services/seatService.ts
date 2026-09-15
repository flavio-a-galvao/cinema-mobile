import { getApi } from '@/services/api';
import { getSessionById } from '@/services/sessionService';
import type { Seat, SessionSeat } from '@/types/seat';

type SeatOccupancy = { id_sessao: number; id_assento: number };

export async function listSessionSeats(sessionId: number, token: string): Promise<SessionSeat[]> {
  const session = await getSessionById(sessionId);
  if (session.id_sala === null) return [];

  const [seats, tickets] = await Promise.all([
    getApi().get<Seat[]>('/catalogo/assentos'),
    getApi().get<SeatOccupancy[]>('/ingressos', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);
  const occupiedIds = new Set(tickets.data
    .filter((ticket) => ticket.id_sessao === sessionId)
    .map((ticket) => ticket.id_assento));

  return seats.data
    .filter((seat) => seat.id_sala === session.id_sala)
    .map((seat) => ({ ...seat, occupied: occupiedIds.has(seat.id_assento) }));
}
