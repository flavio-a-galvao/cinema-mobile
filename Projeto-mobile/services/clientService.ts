import { getApi } from '@/services/api';
import type { Client, UpsertMyClientInput } from '@/types/client';

/** Mantém o erro 404 para o chamador decidir quando criar o Cliente. */
export async function getMyClient(token: string): Promise<Client> {
  const { data } = await getApi().get<Client>('/clientes/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function upsertMyClient(
  { nome, telefone, data_nascimento }: UpsertMyClientInput,
  token: string,
): Promise<Client> {
  const { data } = await getApi().post<Client>(
    '/clientes/me',
    {
      nome,
      ...(telefone !== undefined ? { telefone } : {}),
      ...(data_nascimento !== undefined ? { data_nascimento } : {}),
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}
