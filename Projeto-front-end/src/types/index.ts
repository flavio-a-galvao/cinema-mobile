export type UserRole = "admin" | "adm" | "cliente" | "funcionario" | string;

export interface SessionData {
  nome: string;
  email: string;
  id_usuario: number;
  tipo_usuario: UserRole;
  token: string;
  loggedInAt?: string;
}

export interface PaginationMeta {
  page: number;
  totalPages: number;
  total: number;
}

export interface PagedResponse<T> {
  data: T[];
  pagination?: {
    page?: number;
    totalPages?: number;
    total?: number;
    limit?: number;
  };
  page?: number;
  total?: number;
  totalPages?: number;
}

export type AdminFormMode = "create" | "edit";

export interface Filme {
  id_filme: number;
  titulo: string;
  genero?: string;
  classificacao_etaria?: string;
  duracao?: number;
  sinopse?: string;
  poster_url?: string;
  data_lancamento?: string;
}

export interface Sala {
  id_sala: number;
  nome: string;
  capacidade: number;
}

export interface Sessao {
  id_sessao: number;
  id_filme: number;
  id_sala: number;
  horario: string;
  preco: number;
}

export type ListPayload<T> = PagedResponse<T> | T[];
