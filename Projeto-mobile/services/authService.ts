import { getApi } from '@/services/api';
import type { LoginResponse } from '@/types/auth';

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await getApi().post<LoginResponse>('/auth/login', { email, senha });
  return response.data;
}
