import { getApi } from '@/services/api';
import type { Movie } from '@/types/movie';

export async function listMovies(): Promise<Movie[]> {
  const { data } = await getApi().get<Movie[]>('/catalogo/filmes');
  return data;
}

export async function getMovieById(id: number): Promise<Movie> {
  const { data } = await getApi().get<Movie>(`/catalogo/filmes/${id}`);
  return data;
}
