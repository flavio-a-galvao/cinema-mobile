import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { Request, Response } from 'express';
import express from 'express';
import ts from 'typescript';
import SwaggerParser from '@apidevtools/swagger-parser';
import jwt from 'jsonwebtoken';
import specification from '../src/docs/openapi.json';
import { JWT_SECRET } from '../src/config/auth';

// Rotas e middlewares reais; controllers isolados para não depender de MySQL.
const handler = vi.fn((_req: Request, res: Response) => res.sendStatus(204));
for (const name of ['auth', 'users', 'clientes', 'compras', 'filmes', 'salas', 'assentos', 'sessoes', 'ingressos', 'pagamentos']) {
  vi.doMock(`../src/controllers/${name}.controller`, () => ({
    default: Object.fromEntries([
      'createBatch', 'cancel', 'occupancy', 'login', 'findAll', 'getById',
      'create', 'update', 'delete', 'getMyProfile', 'upsertMyProfile', 'findMyPurchases',
    ].map(method => [method, handler])),
  }));
}
vi.doMock('../src/controllers/salasAssentos.controller', () => ({ generateRoomSeats: handler }));
vi.doMock('../src/controllers/posters.controller', () => ({ uploadPoster: handler }));

// AST do TypeScript, em vez de uma lista manual duplicada das rotas.
const appSource = readFileSync(path.resolve(__dirname, '../src/app.ts'), 'utf8');
const ast = ts.createSourceFile('app.ts', appSource, ts.ScriptTarget.Latest, true);
const routes: { method: string; path: string; auth: boolean; admin: boolean }[] = [];
const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
    && node.expression.expression.getText(ast) === 'router'
    && methods.has(node.expression.name.text) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
    const middlewares = node.arguments.slice(1).map(arg => arg.getText(ast));
    routes.push({
      method: node.expression.name.text,
      path: node.arguments[0].text.replace(/:([A-Za-z_]+)/g, '{$1}'),
      auth: middlewares.includes('requireAuth'), admin: middlewares.includes('requireAdmin'),
    });
  }
  ts.forEachChild(node, visit);
}
visit(ast);
// Tipo de consulta para os elementos heterogêneos do JSON OpenAPI.
type Operation = { security: object[]; 'x-roles'?: string[]; parameters?: { name: string; in: string; required?: boolean }[]; responses: Record<string, unknown>; operationId: string };
const paths = specification.paths as unknown as Record<string, Record<string, Operation>>;
let server: Server;
let base: string;

beforeAll(async () => {
  const { default: app } = await import('../src/app');
  const host = express();
  // Simula a remoção de /api pelo proxy sem iniciar Docker/Nginx.
  host.use('/api', app);
  host.use(app);
  server = await new Promise<Server>(resolve => {
    const listening = host.listen(0, '127.0.0.1', () => resolve(listening));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

it('valida OpenAPI 3.0.3 e referências locais com Swagger Parser', async () => {
  const api = await SwaggerParser.validate(path.resolve(__dirname, '../src/docs/openapi.json'), { resolve: { external: false } });
  expect(api.openapi).toBe('3.0.3');
});

it('cobre exatamente todas as operações do router, sem inventar rotas ou IDs repetidos', () => {
  const actual = routes.map(route => `${route.method} ${route.path}`).sort();
  const documented = Object.entries(paths).flatMap(([url, item]) =>
    Object.keys(item).filter(method => methods.has(method)).map(method => `${method} ${url}`)).sort();
  expect(actual.length).toBeGreaterThan(40);
  expect(documented).toEqual(actual);
  const ids = Object.values(paths).flatMap(item => Object.values(item).map(op => op.operationId));
  expect(new Set(ids).size).toBe(ids.length);
});

describe.each(routes)('$method $path', route => {
  const operation = paths[route.path]?.[route.method];
  const url = route.path.replace(/{[^}]+}/g, '1');
  it('documenta parâmetros, Bearer e papel conforme os middlewares existentes', () => {
    expect(operation).toBeDefined();
    expect(operation.security).toEqual(route.auth ? [{ bearerAuth: [] }] : []);
    expect(operation['x-roles'] ?? []).toEqual(route.admin ? ['admin'] : []);
    for (const match of route.path.matchAll(/{([^}]+)}/g)) {
      expect(operation.parameters).toContainEqual(expect.objectContaining({ name: match[1], in: 'path', required: true }));
    }
    if (route.auth) expect(operation.responses).toHaveProperty('401');
    if (route.admin) expect(operation.responses).toHaveProperty('403');
  });
  it('preserva acesso HTTP público/protegido na aplicação montada', async () => {
    const response = await fetch(base + url, { method: route.method.toUpperCase() });
    await response.text();
    expect(response.status).toBe(route.auth ? 401 : route.path === '/' ? 200 : 204);
  });
  if (route.admin) it('mantém proibição de acesso administrativo para papel cliente', async () => {
    const token = jwt.sign({ id_usuario: 1, email: 'cliente@example.test', tipo_usuario: 'cliente' }, JWT_SECRET, { expiresIn: '1m' });
    const response = await fetch(base + url, { method: route.method.toUpperCase(), headers: { Authorization: `Bearer ${token}` } });
    await response.text();
    expect(response.status).toBe(403);
  });
});

describe.each(['', '/api'])('Swagger sob prefixo "%s"', prefix => {
  it('redireciona preservando o prefixo e entrega HTML sem scripts inline', async () => {
    const response = await fetch(base + prefix + '/api-docs', { redirect: 'manual' });
    expect(response.status).toBe(308);
    const target = new URL(response.headers.get('location')!, base + prefix + '/api-docs');
    expect(target.pathname).toBe(prefix + '/api-docs/');
    const html = await (await fetch(target)).text();
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('./assets/swagger-ui-bundle.js');
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i);
    for (const match of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g)) {
      const asset = await fetch(new URL(match[1], target));
      expect(asset.status).toBe(200);
      expect((await asset.text()).length).toBeGreaterThan(100);
    }
  });
  it('serve JSON idêntico ao arquivo e resolve Try it out para a raiz correta', async () => {
    const url = base + prefix + '/api-docs/openapi.json';
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const api = await response.json();
    expect(api).toEqual(specification);
    expect(new URL(api.servers[0].url, url).pathname).toBe(prefix + '/');
  });
});

it('não carrega documentação de serviços externos nem persiste credenciais no inicializador', async () => {
  const script = await (await fetch(base + '/api-docs/swagger-initializer.js')).text();
  expect(script).toContain('validatorUrl: null');
  expect(script).toContain('persistAuthorization: false');
  expect(script).toContain('queryConfigEnabled: false');
  expect(script).not.toMatch(/https?:\/\/|localStorage|sessionStorage/);
  const json = JSON.stringify(specification);
  expect(json).not.toMatch(/cinemax-dev-secret|DB_PASS|MYSQL_PASSWORD|eyJ[A-Za-z0-9_-]+\./);
  expect(specification.components.schemas.Usuario.properties).not.toHaveProperty('senha');
  expect(specification.components.schemas.UsuarioInput.properties.senha.writeOnly).toBe(true);
});
