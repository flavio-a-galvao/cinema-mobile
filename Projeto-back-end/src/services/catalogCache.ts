import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';
import { log } from './logger';

type Collection = 'filmes' | 'sessoes';
export interface CacheStore {
  close?(): void;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<unknown>;
}

// Injetável para testar a política sem rede, relógio real ou banco.
export class CatalogCache {
  private bypassUntil = 0;
  private lastWarning = -Infinity;
  constructor(private store: CacheStore | undefined, private ttl = 60) {}

  close(): void { this.store?.close?.(); }

  private warn(operation: string) {
    if (Date.now() - this.lastWarning >= 5000) {
      log('warn', 'redis_cache', 'fallback', {
        operation,
        message: '[cache Redis] Falha; usando banco de dados. Cache pode permanecer desatualizado até o TTL.',
      });
      this.lastWarning = Date.now();
    }
  }

  async remember<T>(collection: Collection, variant: string, load: () => Promise<T>): Promise<T> {
    if (!this.store || Date.now() < this.bypassUntil) return load();
    let key: string | undefined;
    try {
      const version = await this.store.get(`cinemax:catalogo:${collection}:version`) ?? '0';
      key = `cinemax:catalogo:${collection}:${version}:${variant}`;
      const cached = await this.store.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch {
      this.warn('leitura/conexão');
      key = undefined;
    }
    // Erros do banco propagam normalmente e nunca são armazenados.
    const value = await load();
    if (key && value != null) {
      try { await this.store.set(key, JSON.stringify(value), this.ttl); }
      catch { this.warn('gravação'); }
    }
    return value;
  }

  async invalidate(collection: Collection): Promise<void> {
    if (!this.store) return;
    try {
      // Uma leitura concorrente só poderá gravar na versão antiga, já inacessível.
      await this.store.set(`cinemax:catalogo:${collection}:version`, randomUUID());
    } catch {
      this.bypassUntil = Date.now() + this.ttl * 1000;
      this.warn('invalidação');
    }
  }
}

export function redisStore(url: string, timeout = 500): CacheStore {
  const client = createClient({
    url,
    disableOfflineQueue: true,
    socket: { connectTimeout: timeout, reconnectStrategy: false },
  });
  // O evento deve ter listener; as falhas são reportadas pela política acima.
  client.on('error', () => undefined);
  let connecting: Promise<unknown> | undefined;
  let retryAfter = 0;
  async function run<T>(command: () => Promise<T>): Promise<T> {
    if (Date.now() < retryAfter) throw new Error('Redis em intervalo de reconexão');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          if (!client.isReady) {
            connecting ??= client.connect().finally(() => { connecting = undefined; });
            await connecting;
          }
          return command();
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Redis timeout')), timeout);
        }),
      ]);
    } catch (error) {
      retryAfter = Date.now() + 5000;
      if (client.isOpen) client.destroy();
      throw error;
    } finally { clearTimeout(timer); }
  }
  return {
    close: () => { retryAfter = Infinity; if (client.isOpen) client.destroy(); },
    get: key => run(() => client.get(key)),
    set: (key, value, ttl) => run(() => client.set(key, value, ttl ? { EX: ttl } : undefined)),
  };
}

const configuredTTL = Number(process.env.CACHE_TTL_SECONDS ?? 60);
const ttl = Number.isSafeInteger(configuredTTL) && configuredTTL > 0 ? configuredTTL : 60;
// Sem URL, o desenvolvimento local e os testes existentes continuam sem Redis.
export const catalogCache = new CatalogCache(process.env.REDIS_URL ? redisStore(process.env.REDIS_URL) : undefined, ttl);
