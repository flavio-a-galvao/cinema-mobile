import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/types/auth';

const TOKEN_KEY = 'cinema.auth.token';
const USER_KEY = 'cinema.auth.user';

export function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export function saveUser(user: AuthUser): Promise<void> {
  return SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<AuthUser | null> {
  const stored = await SecureStore.getItemAsync(USER_KEY);
  if (!stored) return null;

  try {
    const user: unknown = JSON.parse(stored);
    if (
      typeof user !== 'object' || user === null ||
      !('id_usuario' in user) || typeof user.id_usuario !== 'number' || !Number.isInteger(user.id_usuario) ||
      !('nome' in user) || typeof user.nome !== 'string' ||
      !('email' in user) || typeof user.email !== 'string' ||
      !('tipo_usuario' in user) ||
      (user.tipo_usuario !== 'admin' && user.tipo_usuario !== 'funcionario' && user.tipo_usuario !== 'cliente')
    ) return null;

    return {
      id_usuario: user.id_usuario,
      nome: user.nome,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    };
  } catch {
    return null;
  }
}
