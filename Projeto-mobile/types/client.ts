/** Cliente retornado por /clientes/me; id_cliente é distinto de id_usuario. */
export type Client = {
  id_cliente: number;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
};

/** O backend obtém o email do JWT, sem recebê-lo no payload. */
export type UpsertMyClientInput = {
  nome: string;
  telefone?: string;
  data_nascimento?: string;
};
