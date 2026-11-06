import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express, { type Express, type Request, type Response } from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { EventEmitter } from 'node:events';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/auth';
import { observeHttp, handleError, observationScope } from '../src/middlewares/observability';
import { correlationId, errorMetadata, log, requestContext } from '../src/services/logger';
import { HttpMetrics } from '../src/services/httpMetrics';
import { CatalogCache } from '../src/services/catalogCache';

beforeEach(() => {
  for (const level of ['info', 'warn', 'error'] as const) vi.spyOn(console, level).mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());
const lines = (level: 'info' | 'warn' | 'error') => vi.mocked(console[level]).mock.calls.map(([line]) => JSON.parse(line));
async function serve(app: Express, check: (base: string) => Promise<void>) {
  const server = await new Promise<Server>(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  try { await check(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

it('aceita somente UUID v4 como correlação; rejeita entradas arbitrárias', () => {
  const id = '123e4567-e89b-42d3-a456-426614174000';
  expect(correlationId(id)).toBe(id);
  expect(correlationId(id.toUpperCase())).toBe(id);
  for (const value of [undefined, ['a'], 'senha-token', 'x'.repeat(1000), id + '\n']) {
    expect(correlationId(value)).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  }
});

it('filtra campos não permitidos e metadados de erro sem serializar dados sensíveis', () => {
  log('info', 'runtime', 'check', { count: 1, password: 'segredo', token: 'segredo', body: { cpf: 'segredo' }, headers: { authorization: 'segredo' } });
  expect(lines('info')[0]).toMatchObject({ service: 'cinemax-backend', count: 1, level: 'info', component: 'runtime', action: 'check' });
  expect(JSON.stringify(lines('info'))).not.toContain('segredo');
  expect(errorMetadata({ name: 'nome-com-segredo', message: 'segredo', code: 'segredo' })).toEqual({ errorType: 'UnknownError' });
});

it('isola correlação entre requisições concorrentes e oculta URL, parâmetros, headers e corpo', async () => {
  const metrics = new HttpMetrics();
  const app = express();
  app.use(observeHttp(metrics), express.json());
  app.post('/items/:id', async (_req, res) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    log('info', 'runtime', 'inside_request');
    res.json({ ok: true });
  });
  const ids = ['123e4567-e89b-42d3-a456-426614174000', '123e4567-e89b-42d3-a456-426614174001'];
  await serve(app, async base => {
    await Promise.all(ids.map(async requestId => {
      const response = await fetch(base + '/items/segredo-url?token=segredo-query', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer segredo-jwt', 'X-Request-Id': requestId },
        body: JSON.stringify({ senha: 'segredo-body', email: 'segredo-email' }),
      });
      expect(response.headers.get('x-request-id')).toBe(requestId);
      expect(response.status).toBe(200); await response.text();
    }));
  });
  const logs = lines('info');
  expect(logs.filter(line => line.action === 'inside_request').map(line => line.requestId).sort()).toEqual(ids);
  expect(logs.filter(line => line.component === 'http')).toHaveLength(2);
  expect(logs.filter(line => line.component === 'http').every(line => line.route === '/items/:id')).toBe(true);
  expect(JSON.stringify(logs)).not.toContain('segredo');
  expect(metrics.snapshot().business.completedRequests).toBe(2);
  expect(requestContext.getStore()).toBeUndefined();
});

it('mantém contrato 500 e correlaciona erro central sanitizado, incluindo falha do banco', async () => {
  const metrics = new HttpMetrics();
  const app = express(); app.use(observeHttp(metrics));
  app.get('/failure', async () => {
    throw Object.assign(new Error('segredo-senha'), {
      name: 'SequelizeDatabaseError', sql: 'segredo-sql', parameters: { senha: 'segredo' },
      original: { code: 'ECONNREFUSED', sqlMessage: 'segredo' },
    });
  });
  app.use(handleError);
  await serve(app, async base => {
    const response = await fetch(base + '/failure');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'Erro interno do servidor.' });
    const errors = lines('error');
    expect(errors.find(line => line.action === 'request_error')).toMatchObject({
      requestId: response.headers.get('x-request-id'), errorType: 'SequelizeDatabaseError', code: 'ECONNREFUSED',
    });
  });
  expect(JSON.stringify(lines('error'))).not.toContain('segredo');
  expect(metrics.snapshot().business).toMatchObject({ completedRequests: 1, serverErrors: 1 });
});

it('encerra resposta já iniciada sem encaminhar erro bruto ao handler final', () => {
  const next = vi.fn();
  const destroy = vi.fn();
  handleError(new Error('segredo'), { method: 'GET' } as Request,
    { headersSent: true, locals: {}, destroy } as unknown as Response, next);
  expect(destroy).toHaveBeenCalledTimes(1);
  expect(next).not.toHaveBeenCalled();
  expect(JSON.stringify(lines('error'))).not.toContain('segredo');
});

it('registra emissão/pagamento como operação crítica sem repetir escrita', async () => {
  const app = express(); app.use(observeHttp(new HttpMetrics()));
  const write = vi.fn();
  app.post('/pagamentos', (_req, res) => { write(); res.status(201).json({ id_pagamento: 1 }); });
  await serve(app, async base => {
    const response = await fetch(base + '/pagamentos', { method: 'POST' });
    expect(response.status).toBe(201); await response.text();
  });
  expect(write).toHaveBeenCalledTimes(1);
  expect(lines('info')).toContainEqual(expect.objectContaining({ action: 'critical_operation_completed', route: '/pagamentos', status: 201 }));
});

it('conta cancelamento de conexão uma vez, sem fingir resposta HTTP concluída', () => {
  const metrics = new HttpMetrics();
  const req = { headers: {}, method: 'GET', route: { path: '/slow' } } as Request;
  const res = Object.assign(new EventEmitter(), { locals: {}, setHeader: vi.fn(), statusCode: 200, writableFinished: false });
  observeHttp(metrics)(req, res as unknown as Response, () => undefined);
  res.emit('close'); res.emit('finish'); res.emit('close');
  expect(metrics.snapshot().business).toMatchObject({ completedRequests: 0, abortedRequests: 1 });
  expect(lines('error')).toHaveLength(1);
  expect(lines('error')[0]).not.toHaveProperty('status');
});

it('exclui health, Swagger e estáticos do SLI de negócio', async () => {
  const metrics = new HttpMetrics(); const app = express(); app.use(observeHttp(metrics));
  app.get('/', (_req, res) => res.send('ok'));
  app.use('/api-docs', observationScope('/api-docs/*'), (_req, res) => res.send('docs'));
  app.get('/items', (_req, res) => res.status(400).json({ message: 'Inválido' }));
  await serve(app, async base => {
    for (const route of ['/', '/api-docs/', '/aleatorio-segredo', '/items']) await (await fetch(base + route)).text();
  });
  expect(metrics.snapshot().http.completedRequests).toBe(4);
  expect(metrics.snapshot().business).toMatchObject({ completedRequests: 1, clientErrors: 1 });
  expect(JSON.stringify(metrics.snapshot())).not.toContain('segredo');
});

it('preserva fallback Redis com log JSON e correlação, sem expor erro do driver', async () => {
  const cache = new CatalogCache({ get: async () => { throw new Error('segredo-redis'); }, set: vi.fn() });
  const requestId = '123e4567-e89b-42d3-a456-426614174000';
  await requestContext.run({ requestId }, async () => {
    expect(await cache.remember('filmes', 'all', async () => ['banco'])).toEqual(['banco']);
  });
  expect(lines('warn')).toContainEqual(expect.objectContaining({ component: 'redis_cache', action: 'fallback', requestId }));
  expect(JSON.stringify(lines('warn'))).not.toContain('segredo-redis');
});

describe('Métricas', () => {
  it('conta status e erros e calcula histograma cumulativo com limites exatos', () => {
    const metrics = new HttpMetrics();
    for (const [durationMs, status] of [[25, 200], [100, 401], [500, 500], [2001, 200]]) {
      metrics.record({ method: 'GET', route: '/items', durationMs, status, aborted: false, business: true });
    }
    const snapshot = metrics.snapshot();
    expect(snapshot.business).toMatchObject({ completedRequests: 4, clientErrors: 1, serverErrors: 1, latencyMs: { sum: 2626 } });
    expect(snapshot.business.latencyMs.buckets.map(bucket => bucket.count)).toEqual([1, 2, 2, 3, 3, 3, 4, 4]);
    snapshot.business.completedRequests = 0;
    expect(metrics.snapshot().business.completedRequests).toBe(4);
  });
  it('limita a quantidade de séries sem perder totais globais', () => {
    const metrics = new HttpMetrics();
    for (let i = 0; i < 300; i++) metrics.record({ method: 'GET', route: '/route-' + i, status: 200, durationMs: 1, aborted: false, business: true });
    expect(metrics.snapshot().routes).toHaveLength(256);
    expect(metrics.snapshot().http.completedRequests).toBe(300);
  });
  it('protege o endpoint real com JWT/admin e não altera o healthcheck', async () => {
    const { default: app } = await import('../src/app');
    await serve(app, async base => {
      expect((await fetch(base + '/metrics')).status).toBe(401);
      const token = (role: string) => jwt.sign({ id_usuario: 1, email: 'teste@example.test', tipo_usuario: role }, JWT_SECRET, { expiresIn: '1m' });
      expect((await fetch(base + '/metrics', { headers: { Authorization: 'Bearer ' + token('cliente') } })).status).toBe(403);
      const response = await fetch(base + '/metrics', { headers: { Authorization: 'Bearer ' + token('admin') } });
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toMatchObject({ startedAt: expect.any(String), business: { completedRequests: expect.any(Number) } });
      expect((await fetch(base + '/')).status).toBe(200);
    });
  });
});
