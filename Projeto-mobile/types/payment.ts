export type PaymentMethod = 'cartao' | 'pix' | 'dinheiro';
export type CreatePaymentInput = { id_ingresso: number; valor: number; metodo_pagamento: PaymentMethod };
export type Payment = Omit<CreatePaymentInput, 'valor'> & { id_pagamento: number; valor: number | string; data_pagamento: string | null };
export type Purchase = {
  id: number;
  status: 'ativo' | 'cancelado';
  sala: string;
  horario: string | null;
  podeCancelar: boolean;
  canceladoEm: string | null;
  filme: string;
  sessao: string;
  assento: string;
  valor: number;
  metodo: string;
  dataCompra: string;
};
