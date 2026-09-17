export type CreateTicketInput = {
  id_sessao: number;
  /** ID do registro Cliente; não é o id_usuario da autenticação. */
  id_cliente: number;
  id_assento: number;
  /** Opcional: quando omitida, o backend usa a data atual. */
  data_compra?: string;
};

/** Resposta JSON de POST /ingressos. */
export type Ticket = {
  tipo_ingresso: 'inteira' | 'meia' | null;
  valor_unitario: number | string | null;
  status: 'ativo' | 'cancelado';
  cancelado_em: string | null;
  id_ingresso: number;
  id_sessao: number;
  id_cliente: number;
  id_assento: number;
  data_compra: string | null;
};

export type CreateTicketsInput = { id_sessao: number; id_cliente: number; id_assentos: number[]; qtdInteira: number; qtdMeia: number };
