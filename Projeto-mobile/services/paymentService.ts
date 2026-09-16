import { getApi } from '@/services/api';
import type { CreatePaymentInput, Payment, Purchase } from '@/types/payment';

export async function listMyPurchases(token: string): Promise<Purchase[]> {
  const { data } = await getApi().get<Purchase[]>('/me/compras', { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function createPayment(input: CreatePaymentInput, token: string): Promise<Payment> {
  // Confirma a titularidade pela resposta autenticada, sem receber id_cliente da tela.
  const purchases = await listMyPurchases(token);
  const own = purchases.find((purchase) => purchase.id === input.id_ingresso);
  if (!own) throw new Error('Ingresso não pertence à conta autenticada.');
  if (own.metodo !== 'Nao informado') throw new Error('Já existe pagamento para este ingresso.');
  const { id_ingresso, valor, metodo_pagamento } = input;
  const { data } = await getApi().post<Payment>('/pagamentos', { id_ingresso, valor, metodo_pagamento }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
