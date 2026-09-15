import { getApi } from '@/services/api';
import type { CreateTicketInput, Ticket } from '@/types/ticket';

/** O backend cria um ingresso por requisição. */
export async function createTicket(
  { id_sessao, id_cliente, id_assento, data_compra }: CreateTicketInput,
  token: string,
): Promise<Ticket> {
  const { data } = await getApi().post<Ticket>(
    '/ingressos',
    { id_sessao, id_cliente, id_assento, ...(data_compra !== undefined ? { data_compra } : {}) },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}
