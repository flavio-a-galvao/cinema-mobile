import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const correlationId = (value: unknown): string =>
  typeof value === 'string' && uuid.test(value) ? value.toLowerCase() : randomUUID();

type Level = 'info' | 'warn' | 'error';
type Component = 'http' | 'database' | 'redis_cache' | 'redis_pubsub' | 'runtime';
// Somente metadados operacionais controlados pelo código, nunca objetos de erro/HTTP.
const allowedFields = new Set([
  'requestId', 'method', 'route', 'status', 'durationMs', 'operation', 'aborted',
  'errorType', 'code', 'attempt', 'maxAttempts', 'delayMs', 'port', 'count',
  'eventId', 'type', 'id', 'channel', 'channels', 'subscribers', 'connection', 'message',
  'timestamp',
]);

export function log(level: Level, component: Component, action: string, fields: object = {}): void {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!allowedFields.has(key)) continue;
    if (key === 'channels') {
      if (Array.isArray(value)) safe[key] = value.filter(v => /^cinemax:eventos:(filmes|sessoes)$/.test(v));
    } else if ((typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean') {
      safe[key] = value;
    } else if (typeof value === 'string' && value.length <= 250) {
      safe[key] = value;
    }
  }
  const requestId = requestContext.getStore()?.requestId;
  const loggedAt = new Date().toISOString();
  console[level](JSON.stringify({
    loggedAt, timestamp: loggedAt, service: 'cinemax-backend', level,
    component, action, ...safe, ...(requestId ? { requestId } : {}),
  }));
}

const codes = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH',
  'EAI_AGAIN', 'ENOTFOUND', 'EPIPE', 'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_DUP_ENTRY',
  'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT', 'ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2',
]);
const errorNames = new Set([
  'Error', 'TypeError', 'SyntaxError', 'SequelizeConnectionError',
  'SequelizeConnectionRefusedError', 'SequelizeConnectionTimedOutError',
  'SequelizeConnectionAcquireTimeoutError', 'SequelizeAccessDeniedError',
  'SequelizeHostNotFoundError', 'SequelizeHostNotReachableError',
  'SequelizeDatabaseError', 'SequelizeUniqueConstraintError', 'SequelizeForeignKeyConstraintError',
]);

export function errorMetadata(error: unknown): { errorType: string; code?: string } {
  if (!error || typeof error !== 'object') return { errorType: 'UnknownError' };
  const value = error as { name?: string; code?: string; original?: { code?: string }; parent?: { code?: string } };
  const code = value.original?.code ?? value.parent?.code ?? value.code;
  return {
    errorType: value.name && errorNames.has(value.name) ? value.name : 'UnknownError',
    ...(code && codes.has(code) ? { code } : {}),
  };
}
