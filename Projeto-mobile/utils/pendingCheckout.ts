import type { Checkout } from '@/contexts/CheckoutContext';
import type { Purchase } from '@/types/payment';

/** Reconstitui o checkout exclusivamente de uma compra retornada por /me/compras. */
export function pendingCheckout(purchase: Purchase, userId: number): Checkout {
  if (!purchase.podePagar || purchase.pago || purchase.status !== 'ativo' || purchase.valor_unitario == null || !purchase.tipo_ingresso) throw new Error('Pagamento indisponível. Atualize seus ingressos.');
  const cents = Math.round(purchase.valor_unitario * 100);
  return {
    userId,
    tickets: [{ id_ingresso: purchase.id, id_sessao: purchase.id_sessao, id_cliente: purchase.id_cliente, id_assento: purchase.id_assento, data_compra: purchase.dataCompra, status: purchase.status, cancelado_em: purchase.canceladoEm, tipo_ingresso: purchase.tipo_ingresso, valor_unitario: purchase.valor_unitario }],
    seatLabels: { [purchase.id_assento]: purchase.assento },
    qtdInteira: purchase.tipo_ingresso === 'inteira' ? 1 : 0,
    qtdMeia: purchase.tipo_ingresso === 'meia' ? 1 : 0,
    fullCents: purchase.tipo_ingresso === 'inteira' ? cents : 0,
    halfCents: purchase.tipo_ingresso === 'meia' ? cents : 0,
    status: 'ready', payments: [],
  };
}
