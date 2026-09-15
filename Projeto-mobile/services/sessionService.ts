import { getApi } from '@/services/api';
import type { MovieSession } from '@/types/session';

export async function listSessionsByMovie(movieId: number): Promise<MovieSession[]> {
  // O endpoint público ainda não oferece filtro por filme.
  const { data } = await getApi().get<MovieSession[]>('/catalogo/sessoes');
  return data.filter((session) => session.id_filme === movieId);
}

export async function getSessionById(id: number): Promise<MovieSession> {
  const { data } = await getApi().get<MovieSession>(`/catalogo/sessoes/${id}`);
  return data;
}
