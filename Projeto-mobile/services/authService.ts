import { getApi } from '@/services/api';
import { getToken, getUser, removeToken } from '@/services/authStorage';
import type { AuthUser, LoginResponse, RegisterInput, RegisterResponse } from '@/types/auth';

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await getApi().post<LoginResponse>('/auth/login', { email, senha });
  return response.data;
}

export async function register({ nome, cpf, email, senha }: RegisterInput): Promise<RegisterResponse> {
  const response = await getApi().post<RegisterResponse>('/users', {
    nome: nome.trim(),
    cpf: cpf.replace(/\D/g, ''),
    email: email.trim().toLowerCase(),
    senha,
  });
  return response.data;
}

// Verificação local de consistência e expiração; a assinatura é validada pelo backend.
function matchesStoredUser(token: string, user: AuthUser): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => !part)) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const json = decodeURIComponent(Array.from(bytes, (byte) =>
      `%${byte.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
    const payload: unknown = JSON.parse(json);
    return typeof payload === 'object' && payload !== null &&
      'exp' in payload && typeof payload.exp === 'number' &&
      payload.exp > Date.now() / 1000 &&
      'id_usuario' in payload && payload.id_usuario === user.id_usuario &&
      'email' in payload && payload.email === user.email &&
      'tipo_usuario' in payload && payload.tipo_usuario === user.tipo_usuario;
  } catch {
    return false;
  }
}

export async function restoreSession(): Promise<LoginResponse | null> {
  const token = await getToken();
  if (!token) return null;

  const user = await getUser();
  if (!user || !matchesStoredUser(token, user)) {
    await removeToken();
    return null;
  }

  return { token, user };
}
