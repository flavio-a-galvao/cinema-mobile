/** Sessão serializada pela API; DECIMAL pode ser retornado como string. */
export type MovieSession = {
  id_sessao: number;
  id_filme: number | null;
  id_sala: number | null;
  horario: string | null;
  preco: string | number | null;
};
