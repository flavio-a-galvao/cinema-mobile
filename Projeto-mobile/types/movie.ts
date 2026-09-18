/** Filme serializado pela API. Campos sem allowNull: false podem retornar null. */
export type Movie = {
  id_filme: number;
  titulo: string;
  genero: string | null;
  classificacao_etaria: string | null;
  duracao: number | null;
  sinopse: string | null;
  poster_url: string | null;
  /** Data serializada em JSON, não uma instância de Date. */
  data_lancamento: string | null;
};

export type MovieInput = Omit<Movie, 'id_filme' | 'poster_url'>;
