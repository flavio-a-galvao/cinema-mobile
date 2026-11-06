import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CatalogEvents, createCatalogEvents, EVENT_CHANNELS } from '../src/services/catalogEvents';

// Transporte injetado: exercita publicação e consumidor reais do serviço sem Redis externo.
function transport() {
  const listeners = new Map<string, (message: string, channel: string) => void>();
  class Client extends EventEmitter {
    isReady = false;
    isOpen = false;
    connect = vi.fn(async () => {
      this.isOpen = this.isReady = true;
      this.emit('ready');
    });
    subscribe = vi.fn(async (channels: string[], listener: (message: string, channel: string) => void) => {
      for (const channel of channels) listeners.set(channel, listener);
    });
    publish = vi.fn(async (channel: string, message: string) => {
      const listener = listeners.get(channel);
      listener?.(message, channel);
      return listener ? 1 : 0;
    });
    destroy = vi.fn(() => { this.isOpen = this.isReady = false; listeners.clear(); });
  }
  const publisher = new Client(), subscriber = new Client();
  const events = new CatalogEvents(publisher, subscriber);
  return { publisher, subscriber, events, listeners };
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());
const info = () => vi.mocked(console.info).mock.calls.map(([line]) => JSON.parse(line));

it.each([
  ['filme.created', 'filmes'], ['filme.updated', 'filmes'], ['filme.deleted', 'filmes'],
  ['sessao.created', 'sessoes'], ['sessao.updated', 'sessoes'], ['sessao.deleted', 'sessoes'],
] as const)('%s: publica payload padronizado no canal correto e consumidor processa', async (type, collection) => {
  const { events, publisher, subscriber } = transport();
  events.start();
  await vi.waitFor(() => expect(subscriber.subscribe).toHaveBeenCalledTimes(1));
  expect(await events.publish(type, 7)).toBe(true);
  const [channel, raw] = publisher.publish.mock.calls[0];
  const event = JSON.parse(raw);
  expect(channel).toBe(`cinemax:eventos:${collection}`);
  expect(event).toEqual({ type, id: 7, timestamp: expect.any(String), eventId: expect.any(String) });
  expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  expect(event.eventId).toMatch(/^[a-f0-9-]{36}$/);
  expect(info()).toContainEqual(expect.objectContaining({ component: 'redis_pubsub', level: 'info', action: 'published', channel, ...event, subscribers: 1 }));
  expect(info()).toContainEqual(expect.objectContaining({ component: 'redis_pubsub', level: 'info', action: 'consumed', channel, ...event }));
  events.stop();
});

it('start concorrente não duplica conexões/assinaturas; stop é idempotente', async () => {
  const { events, publisher, subscriber } = transport();
  events.start(); events.start(); events.start();
  await vi.waitFor(() => expect(subscriber.subscribe).toHaveBeenCalledTimes(1));
  expect(publisher.connect).toHaveBeenCalledTimes(1);
  expect(subscriber.connect).toHaveBeenCalledTimes(1);
  expect(subscriber.subscribe).toHaveBeenCalledWith(Object.values(EVENT_CHANNELS), expect.any(Function));
  subscriber.emit('ready'); // Reconexão: node-redis restaura a assinatura já registrada.
  expect(subscriber.subscribe).toHaveBeenCalledTimes(1);
  events.stop(); events.stop(); events.start();
  expect(publisher.destroy).toHaveBeenCalledTimes(1);
  expect(subscriber.destroy).toHaveBeenCalledTimes(1);
  expect(await events.publish('filme.created', 1)).toBe(false);
  expect(publisher.publish).not.toHaveBeenCalled();
});

it('não assina após encerramento enquanto connect estava pendente', async () => {
  const { events, subscriber } = transport();
  let release!: () => void;
  subscriber.connect.mockImplementation(() => new Promise<void>(resolve => { release = resolve; }));
  events.start(); events.stop(); release();
  await Promise.resolve();
  expect(subscriber.subscribe).not.toHaveBeenCalled();
});

it('falhas de conexão, assinatura, publicação e recuperação não propagam à API', async () => {
  const { events, publisher, subscriber } = transport();
  publisher.connect.mockRejectedValueOnce(new Error('credencial secreta'));
  subscriber.subscribe.mockRejectedValueOnce(new Error('offline'));
  events.start();
  await vi.waitFor(() => expect(console.warn).toHaveBeenCalled());
  publisher.isReady = false;
  expect(await events.publish('filme.created', 1)).toBe(false);
  publisher.isReady = true;
  publisher.publish.mockRejectedValueOnce(new Error('offline'));
  expect(await events.publish('filme.created', 1)).toBe(false);
  expect(await events.publish('filme.updated', 1)).toBe(true);
  await vi.waitFor(() => expect(subscriber.subscribe).toHaveBeenCalledTimes(2), { timeout: 2000 });
  publisher.emit('error', new Error('credencial secreta'));
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('credencial secreta');
  events.stop();
});

it('consumidor descarta JSON, tipos, IDs, datas ou canais inválidos e filtra campos extras', async () => {
  const { events, subscriber, listeners } = transport();
  events.start();
  await vi.waitFor(() => expect(subscriber.subscribe).toHaveBeenCalled());
  const consume = listeners.get(EVENT_CHANNELS.filme)!;
  const event = { eventId: '123e4567-e89b-42d3-a456-426614174000', type: 'filme.created', id: 1, timestamp: '2026-11-03T12:00:00.000Z' };
  for (const value of [null, {}, { ...event, type: 'usuario.created' }, { ...event, id: -1 }, { ...event, eventId: '-'.repeat(36) }, { ...event, timestamp: 'inválido' }]) {
    consume(JSON.stringify(value), EVENT_CHANNELS.filme);
  }
  consume('JSON inválido', EVENT_CHANNELS.filme);
  consume(JSON.stringify(event), EVENT_CHANNELS.sessao);
  expect(info().filter(log => log.action === 'consumed')).toHaveLength(0);
  consume(JSON.stringify({ ...event, token: 'segredo' }), EVENT_CHANNELS.filme);
  expect(info().filter(log => log.action === 'consumed')).toHaveLength(1);
  expect(JSON.stringify(info())).not.toContain('segredo');
  events.stop();
  consume(JSON.stringify(event), EVENT_CHANNELS.filme);
  expect(info().filter(log => log.action === 'consumed')).toHaveLength(1);
});

it('sem URL não abre conexões nem exige Redis', async () => {
  const events = createCatalogEvents('');
  events.start();
  expect(await events.publish('filme.created', 1)).toBe(false);
  events.stop();
});

it('cliente Redis real: porta recusada não bloqueia publicação e stop cancela reconexão', async () => {
  const { createServer } = await import('node:net');
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as import('node:net').AddressInfo).port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  const events = createCatalogEvents(`redis://127.0.0.1:${port}`);
  try {
    events.start();
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(await events.publish('sessao.created', 1)).toBe(false);
  } finally { events.stop(); }
});
