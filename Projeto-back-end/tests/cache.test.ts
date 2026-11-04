import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogCache, CacheStore, redisStore } from '../src/services/catalogCache';

function memoryStore() {
  const entries = new Map<string, { value: string; expires: number }>();
  return {
    entries,
    get: vi.fn(async (key: string) => {
      const entry = entries.get(key);
      return entry && entry.expires > Date.now() ? entry.value : null;
    }),
    set: vi.fn(async (key: string, value: string, ttl?: number) => {
      entries.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : Infinity });
    }),
  };
}

beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, 'warn').mockImplementation(() => undefined); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Cache-aside de catálogo', () => {
  it('miss carrega banco, grava EX e hit evita nova consulta entre instâncias', async () => {
    const store = memoryStore();
    const first = new CatalogCache(store, 30), second = new CatalogCache(store, 30);
    const load = vi.fn(async () => [{ id_filme: 1, titulo: 'Cinemax' }]);
    expect(await first.remember('filmes', 'all', load)).toEqual(await second.remember('filmes', 'all', load));
    expect(load).toHaveBeenCalledTimes(1);
    expect(store.set).toHaveBeenCalledWith('cinemax:catalogo:filmes:0:all', JSON.stringify(await load.mock.results[0].value), 30);
  });

  it('TTL expira e força nova consulta ao banco', async () => {
    const store = memoryStore(), cache = new CatalogCache(store, 2);
    const load = vi.fn(async () => []);
    await cache.remember('sessoes', 'all', load);
    vi.advanceTimersByTime(1999);
    await cache.remember('sessoes', 'all', load);
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await cache.remember('sessoes', 'all', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invalida lista, páginas e detalhe em outra instância, isolando coleções', async () => {
    const store = memoryStore(), writer = new CatalogCache(store), reader = new CatalogCache(store);
    const load = vi.fn(async () => ({ titulo: 'Antes' }));
    for (const variant of ['all', 'page:1:limit:10', 'page:2:limit:10', 'id:1']) await reader.remember('filmes', variant, load);
    const sessions = vi.fn(async () => []);
    await reader.remember('sessoes', 'all', sessions);
    await writer.invalidate('filmes');
    load.mockResolvedValue({ titulo: 'Depois' });
    for (const variant of ['all', 'page:1:limit:10', 'page:2:limit:10', 'id:1']) expect(await reader.remember('filmes', variant, load)).toEqual({ titulo: 'Depois' });
    await reader.remember('sessoes', 'all', sessions);
    expect(load).toHaveBeenCalledTimes(8);
    expect(sessions).toHaveBeenCalledTimes(1);
  });

  it('consulta iniciada antes da invalidação não repopula a versão atual', async () => {
    const store = memoryStore(), cache = new CatalogCache(store);
    let release!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>(resolve => { release = resolve; }));
    const pending = cache.remember('filmes', 'all', load);
    await vi.waitFor(() => expect(load).toHaveBeenCalled());
    await cache.invalidate('filmes');
    release('antigo');
    await pending;
    expect(await cache.remember('filmes', 'all', async () => 'novo')).toBe('novo');
  });

  it('não grava 404 (null) nem erros do banco', async () => {
    const store = memoryStore(), cache = new CatalogCache(store);
    await cache.remember('filmes', 'id:404', async () => null);
    await expect(cache.remember('filmes', 'all', async () => { throw new Error('banco'); })).rejects.toThrow('banco');
    expect(store.set).not.toHaveBeenCalled();
  });

  it('falhas de leitura, escrita e invalidação preservam respostas e geram aviso sem segredos', async () => {
    const store = memoryStore(), cache = new CatalogCache(store, 2);
    store.get.mockRejectedValueOnce(new Error('senha secreta'));
    const load = vi.fn(async () => ['banco']);
    expect(await cache.remember('filmes', 'all', load)).toEqual(['banco']);
    store.set.mockRejectedValue(new Error('offline'));
    expect(await cache.remember('filmes', 'all', load)).toEqual(['banco']);
    await expect(cache.invalidate('filmes')).resolves.toBeUndefined();
    expect(await cache.remember('filmes', 'all', load)).toEqual(['banco']);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('usando banco'));
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('senha secreta');
  });

  it('cache desativado ou JSON inválido usa banco', async () => {
    const load = vi.fn(async () => []);
    await new CatalogCache(undefined).remember('filmes', 'all', load);
    const store: CacheStore = { get: vi.fn().mockResolvedValue('inválido'), set: vi.fn() };
    await new CatalogCache(store).remember('filmes', 'all', load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});

it('cliente real: conexão recusada não impede fallback e invalidação', async () => {
  vi.useRealTimers();
  // Porta reservada e fechada: falha de conexão local, sem servidor Redis exigido.
  const { createServer } = await import('node:net');
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as import('node:net').AddressInfo).port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  const cache = new CatalogCache(redisStore(`redis://127.0.0.1:${port}`, 100));
  expect(await cache.remember('filmes', 'all', async () => ['banco'])).toEqual(['banco']);
  await expect(cache.invalidate('filmes')).resolves.toBeUndefined();
  expect(console.warn).toHaveBeenCalled();
});
