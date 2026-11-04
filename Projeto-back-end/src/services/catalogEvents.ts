import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';

export const EVENT_CHANNELS = {
  filme: 'cinemax:eventos:filmes',
  sessao: 'cinemax:eventos:sessoes',
} as const;
type Entity = keyof typeof EVENT_CHANNELS;
type Action = 'created' | 'updated' | 'deleted';
export interface CatalogEvent {
  eventId: string;
  type: `${Entity}.${Action}`;
  id: number;
  timestamp: string;
}

interface Connection {
  readonly isReady: boolean;
  readonly isOpen: boolean;
  connect(): Promise<unknown>;
  destroy(): void;
  on(event: string, listener: () => void): unknown;
}
export interface EventPublisher extends Connection {
  publish(channel: string, message: string): Promise<number>;
}
export interface EventSubscriber extends Connection {
  subscribe(channels: string[], listener: (message: string, channel: string) => void): Promise<unknown>;
}

// Apenas identificadores e metadados; nunca publica req.body, tokens ou dados pessoais.
function validEvent(value: unknown, channel: string): value is CatalogEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as CatalogEvent;
  const entity = typeof event.type === 'string' ? event.type.split('.')[0] as Entity : undefined;
  return !!entity && Object.hasOwn(EVENT_CHANNELS, entity) && EVENT_CHANNELS[entity] === channel
    && /^(filme|sessao)\.(created|updated|deleted)$/.test(event.type)
    && Number.isSafeInteger(event.id) && event.id > 0
    && typeof event.eventId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(event.eventId)
    && typeof event.timestamp === 'string' && Number.isFinite(Date.parse(event.timestamp))
    && new Date(event.timestamp).toISOString() === event.timestamp;
}

export class CatalogEvents {
  private started = false;
  private stopped = false;
  private subscribed = false;
  private subscribing = false;
  private subscriptionRetry?: ReturnType<typeof setTimeout>;
  private warnings = new Map<string, number>();

  constructor(private publisher?: EventPublisher, private subscriber?: EventSubscriber) {
    for (const [name, client] of [['publisher', publisher], ['subscriber', subscriber]] as const) {
      client?.on('error', () => this.warn('connection_error', { connection: name }));
      client?.on('ready', () => {
        this.log('info', 'connection_ready', { connection: name });
        if (name === 'subscriber') this.ensureSubscription();
      });
    }
  }

  private log(level: 'info' | 'warn', action: string, fields: object = {}) {
    console[level](JSON.stringify({ component: 'redis_pubsub', level, action, ...fields }));
  }

  private warn(action: string, fields: { connection?: string; type?: string } = {}) {
    if (this.stopped) return;
    const key = `${action}:${fields.connection ?? ''}`;
    if (Date.now() - (this.warnings.get(key) ?? -Infinity) >= 5000) {
      this.log('warn', action, fields);
      this.warnings.set(key, Date.now());
    }
  }

  // Não aguarda Redis para iniciar HTTP. Um único listener por canal/processo.
  start(): void {
    if (this.started || this.stopped || !this.publisher || !this.subscriber) return;
    this.started = true;
    void this.publisher.connect().catch(() => this.warn('connect_failed', { connection: 'publisher' }));
    void this.subscriber.connect().then(() => this.ensureSubscription())
      .catch(() => this.warn('connect_failed', { connection: 'subscriber' }));
  }

  private ensureSubscription(): void {
    if (!this.started || this.stopped || this.subscribed || this.subscribing || !this.subscriber?.isReady) return;
    this.subscribing = true;
    void this.subscriber.subscribe(Object.values(EVENT_CHANNELS), this.consume).then(() => {
      this.subscribed = true;
      if (!this.stopped) this.log('info', 'subscribed', { channels: Object.values(EVENT_CHANNELS) });
    }).catch(() => {
      this.warn('subscribe_failed', { connection: 'subscriber' });
      if (!this.stopped) {
        this.subscriptionRetry = setTimeout(() => this.ensureSubscription(), 1000).unref();
      }
    }).finally(() => { this.subscribing = false; });
  }

  private consume = (message: string, channel: string): void => {
    if (this.stopped) return;
    try {
      const event: unknown = JSON.parse(message);
      if (!validEvent(event, channel)) { this.warn('invalid_event'); return; }
      // Consumidor de auditoria operacional: normaliza e registra somente campos permitidos.
      const { eventId, type, id, timestamp } = event;
      this.log('info', 'consumed', { channel, eventId, type, id, timestamp });
    } catch { this.warn('invalid_event'); }
  };

  async publish(type: CatalogEvent['type'], id: number): Promise<boolean> {
    if (!this.publisher || this.stopped) return false;
    if (!this.publisher.isReady) { this.warn('publish_unavailable', { type }); return false; }
    const channel = EVENT_CHANNELS[type.split('.')[0] as Entity];
    const event: CatalogEvent = { eventId: randomUUID(), type, id, timestamp: new Date().toISOString() };
    if (!validEvent(event, channel)) { this.warn('invalid_event'); return false; }
    try {
      const subscribers = await this.publisher.publish(channel, JSON.stringify(event));
      this.log('info', 'published', { channel, ...event, subscribers });
      return true;
    } catch { this.warn('publish_failed', { type }); return false; }
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    clearTimeout(this.subscriptionRetry);
    // destroy cancela também conexões/reconexões pendentes e remove assinaturas no servidor.
    for (const client of [this.subscriber, this.publisher]) {
      if (client?.isOpen) client.destroy();
    }
  }
}

export function createCatalogEvents(url = process.env.REDIS_URL): CatalogEvents {
  if (!url) return new CatalogEvents();
  const publisher = createClient({
    url,
    disableOfflineQueue: true,
    commandOptions: { timeout: 500 },
    socket: { connectTimeout: 500, reconnectStrategy: retries => Math.min(250 * (retries + 1), 5000) },
  });
  // A conexão assinante nunca executa PUBLISH nem comandos do cache.
  return new CatalogEvents(publisher, publisher.duplicate());
}

export const catalogEvents = createCatalogEvents();
