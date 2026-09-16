import { getApi } from '@/services/api';
import type { Room, RoomInput, RoomSummary, GeneratedSeats } from '@/types/room';
import type { MovieSession, SessionInput } from '@/types/session';
import type { Seat } from '@/types/seat';
const authorized = (token: string) => ({ headers: { Authorization: 'Bearer ' + token } });
export async function listRooms(token: string): Promise<RoomSummary[]> {
  const [rooms, seats] = await Promise.all([
    getApi().get<Room[]>('/salas', authorized(token)),
    getApi().get<Seat[]>('/assentos', authorized(token)),
  ]);
  const counts = new Map<number, number>();
  for (const seat of seats.data) if (seat.id_sala !== null) counts.set(seat.id_sala, (counts.get(seat.id_sala) ?? 0) + 1);
  return rooms.data.map(room => ({ ...room, quantidade_assentos: counts.get(room.id_sala) ?? 0 }));
}
export async function saveRoom(input: RoomInput, token: string, id?: number): Promise<Room> {
  const response = id ? await getApi().put<Room>('/salas/' + id, input, authorized(token)) : await getApi().post<Room>('/salas', input, authorized(token));
  return response.data;
}
export async function deleteRoom(id: number, token: string): Promise<void> { await getApi().delete('/salas/' + id, authorized(token)); }
export async function generateSeats(id: number, token: string): Promise<GeneratedSeats> {
  const { data } = await getApi().post<GeneratedSeats>('/salas/' + id + '/assentos/gerar', {}, authorized(token)); return data;
}
export async function listSessions(token: string): Promise<MovieSession[]> {
  const { data } = await getApi().get<MovieSession[]>('/sessoes', authorized(token)); return data;
}
export async function saveSession(input: SessionInput, token: string, id?: number): Promise<MovieSession> {
  const response = id ? await getApi().put<MovieSession>('/sessoes/' + id, input, authorized(token)) : await getApi().post<MovieSession>('/sessoes', input, authorized(token));
  return response.data;
}
export async function deleteSession(id: number, token: string): Promise<void> { await getApi().delete('/sessoes/' + id, authorized(token)); }

export async function getAdminSession(id: number, token: string): Promise<MovieSession> {
  const { data } = await getApi().get<MovieSession>('/sessoes/' + id, authorized(token)); return data;
}
