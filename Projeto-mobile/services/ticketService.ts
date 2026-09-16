import { getApi } from '@/services/api';
import type { CreateTicketInput, CreateTicketsInput, Ticket } from '@/types/ticket';

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

export async function createTickets(input: CreateTicketsInput, token: string): Promise<Ticket[]> {
 const { id_sessao, id_cliente, id_assentos, qtdInteira, qtdMeia } = input;
 const { data } = await getApi().post<Ticket[]>('/ingressos/lote', { id_sessao, id_cliente, id_assentos, qtdInteira, qtdMeia }, { headers: { Authorization: `Bearer ${token}` } });
 return data;
}
export async function cancelTicket(id: number, token: string): Promise<Ticket> {
 const { data } = await getApi().patch<Ticket>(`/ingressos/${id}/cancelar`, {}, { headers: { Authorization: `Bearer ${token}` } });
 return data;
}
