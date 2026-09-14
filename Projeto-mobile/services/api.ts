import { create, type AxiosInstance } from 'axios';

let client: AxiosInstance | undefined;

/** Inicialização sob demanda: a demonstração funciona mesmo sem backend ou .env. */
export function getApi(): AxiosInstance {
  if (client) return client;

  const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!baseURL) {
    throw new Error('Configure EXPO_PUBLIC_API_URL no .env do Projeto-mobile.');
  }

  let url: URL;
  try {
    url = new URL(baseURL);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL deve ser uma URL HTTP ou HTTPS válida.');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.hostname.toLowerCase() === 'seu_ip_local') {
    throw new Error('EXPO_PUBLIC_API_URL deve apontar para o endereço HTTP ou HTTPS da sua API.');
  }

  client = create({
    baseURL: baseURL.replace(/\/+$/, ''),
    timeout: 15_000,
    headers: { Accept: 'application/json' },
  });

  return client;
}
