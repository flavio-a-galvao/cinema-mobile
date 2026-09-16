import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/auth';

// Isola banco e controllers; executa as rotas e middlewares reais.
const controller = vi.fn((_req: Request, res: Response) => res.sendStatus(204));
for (const name of ['auth', 'users', 'clientes', 'compras', 'filmes', 'salas', 'assentos', 'sessoes', 'ingressos', 'pagamentos']) {
    vi.doMock(`../src/controllers/${name}.controller`, () => ({
        default: Object.fromEntries(
            ['createBatch', 'cancel', 'occupancy', 'login', 'findAll', 'getById', 'create', 'update', 'delete', 'getMyProfile', 'upsertMyProfile', 'findMyPurchases']
                .map((method) => [method, controller]),
        ),
    }));
}

let server: Server;
let baseURL: string;
beforeAll(async () => {
    const { default: app } = await import('../src/app');
    await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', resolve);
    });
    baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
    if (server) {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});
beforeEach(() => { controller.mockClear(); });

const administrativeRoutes = [
    ...['filmes', 'salas', 'sessoes'].flatMap((resource) => [
        { method: 'POST', path: `/${resource}` },
        { method: 'PUT', path: `/${resource}/1` },
        { method: 'DELETE', path: `/${resource}/1` },
    ]),
    { method: 'POST', path: '/assentos' },
    { method: 'POST', path: '/clientes' },
];

describe.each(administrativeRoutes)('$method $path', ({ method, path }) => {
    it.each([
        { role: null, status: 401 },
        { role: 'cliente', status: 403 },
        { role: 'funcionario', status: 403 },
        { role: 'admin', status: 204 },
    ])('retorna $status para perfil $role', async ({ role, status }) => {
        const headers: Record<string, string> = {};
        if (role) {
            const token = jwt.sign(
                { id_usuario: 1, email: 'teste@example.com', tipo_usuario: role },
                JWT_SECRET,
                { expiresIn: '1h' },
            );
            headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(`${baseURL}${path}`, { method, headers });
        await response.text();
        expect(response.status).toBe(status);
        expect(controller).toHaveBeenCalledTimes(role === 'admin' ? 1 : 0);
    });
});

describe('Leitura pública do catálogo', () => {
    it.each(['filmes', 'sessoes', 'assentos'].flatMap((resource) => [
        `/catalogo/${resource}`, `/catalogo/${resource}/1`,
    ]))('permite GET %s sem token', async (path) => {
        const response = await fetch(`${baseURL}${path}`);
        await response.text();
        expect(response.status).toBe(204);
        expect(controller).toHaveBeenCalledTimes(1);
    });
});
