import { getApi } from '@/services/api';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { Movie, MovieInput } from '@/types/movie';

export async function listMovies(): Promise<Movie[]> {
  const { data } = await getApi().get<Movie[]>('/catalogo/filmes');
  return data;
}

export async function getMovieById(id: number): Promise<Movie> {
  const { data } = await getApi().get<Movie>(`/catalogo/filmes/${id}`);
  return data;
}

export async function listAdminMovies(token: string): Promise<Movie[]> {
  const { data } = await getApi().get<Movie[]>('/filmes', { headers: { Authorization: 'Bearer ' + token } });
  return data;
}
export async function saveMovie(input: MovieInput, token: string, id?: number): Promise<Movie> {
  const config = { headers: { Authorization: 'Bearer ' + token } };
  const { data } = id ? await getApi().put<Movie>('/filmes/' + id, input, config) : await getApi().post<Movie>('/filmes', input, config);
  return data;
}
export async function deleteMovie(id: number, token: string): Promise<void> {
  await getApi().delete('/filmes/' + id, { headers: { Authorization: 'Bearer ' + token } });
}
export async function uploadPoster(id: number, asset: ImagePickerAsset, token: string): Promise<Movie> {
  const form = new FormData();
  const extension = (asset.fileName ?? asset.uri).split('.').pop()?.toLowerCase();
  const inferredMime = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const mime = asset.mimeType ?? inferredMime;
  const filename = mime === 'image/png' ? 'poster.png' : mime === 'image/webp' ? 'poster.webp' : 'poster.jpg';
  if (asset.file) {
    form.append('poster', asset.file, filename);
  } else {
    // React Native aceita uri/name/type no FormData nativo.
    form.append('poster', { uri: asset.uri, name: filename, type: mime } as unknown as Blob);
  }
  const { data } = await getApi().post<Movie>('/filmes/' + id + '/poster', form, {
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
