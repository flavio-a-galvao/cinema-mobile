/** Perfis definidos pelo model User do backend. */
export type UserRole = 'admin' | 'funcionario' | 'cliente';

/** Campos retornados em user por POST /auth/login. */
export type AuthUser = {
  id_usuario: number;
  nome: string;
  email: string;
  tipo_usuario: UserRole;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterInput = {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
};

export type RegisterResponse = AuthUser & {
  cpf: string;
  data_criacao: string;
};

/** Uma sessão autenticada sempre possui usuário e token juntos. */
export type AuthState =
  | { status: 'loading' | 'unauthenticated'; user: null; token: null }
  | ({ status: 'authenticated' } & LoginResponse);
