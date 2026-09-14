import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cinema.auth.token';

export function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function removeToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
