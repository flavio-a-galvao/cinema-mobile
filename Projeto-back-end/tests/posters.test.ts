import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/config/auth';

vi.mock('../src/config/database', async () => {
  const { Sequelize } = await import('sequelize');
  return { default: new Sequelize('test', 'test', 'test', { dialect: 'mysql', logging: false }) };
});
const model = vi.hoisted(() => ({ findByPk: vi.fn() }));
vi.mock('../src/models/Filme', () => ({ default: model }));
let server: Server, base: string, directory: string, png: Buffer;
const movie = { id_filme: 1, poster_url: '', update: vi.fn() };
beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'cinemax-posters-'));
  process.env.POSTER_DIRECTORY = directory;
  png = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } }).png().toBuffer();
  const { default: app } = await import('../src/app');
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  delete process.env.POSTER_DIRECTORY;
  if (directory) await rm(directory, { recursive: true, force: true });
});
beforeEach(() => {
  vi.clearAllMocks();
  model.findByPk.mockResolvedValue(movie);
  movie.update.mockImplementation(async (data) => { movie.poster_url = data.poster_url; return movie; });
});
async function send(bytes: Buffer, name: string, mime: string, role: string | null = 'admin') {
  const form = new FormData();
  form.append('poster', new Blob([new Uint8Array(bytes)], { type: mime }), name);
  const headers: Record<string, string> = {};
  if (role) headers.Authorization = 'Bearer ' + jwt.sign({ id_usuario: 1, email: 'admin@example.com', tipo_usuario: role }, JWT_SECRET, { expiresIn: '1h' });
  return fetch(base + '/filmes/1/poster', { method: 'POST', headers, body: form });
}
describe('Upload real multipart com autorização', () => {
  it.each([{ role: null, status: 401 }, { role: 'cliente', status: 403 }])('bloqueia $role com $status', async ({ role, status }) => {
    const response = await send(png, 'poster.png', 'image/png', role);
    expect(response.status).toBe(status); await response.text();
    expect(movie.update).not.toHaveBeenCalled();
  });
  it.each([
    { name: 'poster.exe', mime: 'image/png' },
    { name: 'poster.png', mime: 'application/octet-stream' },
    { name: 'poster.jpg', mime: 'image/png' },
  ])('rejeita extensão/MIME: $name $mime sem gravar', async ({ name, mime }) => {
    const before = await readdir(directory);
    const response = await send(png, name, mime);
    expect(response.status).toBe(400); await response.text();
    expect(await readdir(directory)).toEqual(before); expect(movie.update).not.toHaveBeenCalled();
  });
  it('rejeita executável renomeado como imagem', async () => {
    const before = await readdir(directory);
    const response = await send(Buffer.from('MZ this is not an image'), 'poster.png', 'image/png');
    expect(response.status).toBe(400); await response.text();
    expect(await readdir(directory)).toEqual(before);
  });
  it('rejeita formato real diferente do declarado', async () => {
    const response = await send(png, 'poster.jpg', 'image/jpeg');
    expect(response.status).toBe(400); await response.text();
  });
  it('rejeita mais de 5 MB com 413 sem gravar', async () => {
    const before = await readdir(directory);
    const response = await send(Buffer.alloc(5 * 1024 * 1024 + 1), 'poster.png', 'image/png');
    expect(response.status).toBe(413); await response.text();
    expect(await readdir(directory)).toEqual(before);
  });
  it.each([{ format: 'png', mime: 'image/png' }, { format: 'jpeg', mime: 'image/jpeg' }, { format: 'webp', mime: 'image/webp' }] as const)('admin envia $format, associa filme e imagem fica pública', async ({ format, mime }) => {
    const bytes = await sharp(png).toFormat(format).toBuffer();
    const response = await send(bytes, 'poster.' + format, mime);
    expect(response.status).toBe(200);
    const result = await response.json() as { poster_url: string };
    expect(result.poster_url).toMatch(/^\/posters\/[a-f0-9-]{36}\.webp$/);
    expect(movie.update).toHaveBeenCalledWith({ poster_url: result.poster_url });
    const stored = await readFile(path.join(directory, path.basename(result.poster_url)));
    expect((await sharp(stored).metadata()).format).toBe('webp');
    const served = await fetch(base + result.poster_url);
    expect(served.status).toBe(200); expect(served.headers.get('content-type')).toContain('image/webp');
    expect(served.headers.get('x-content-type-options')).toBe('nosniff'); await served.arrayBuffer();
  });
  it('nomes originais repetidos não colidem', async () => {
    const first = await (await send(png, 'mesmo.png', 'image/png')).json() as { poster_url: string };
    const second = await (await send(png, 'mesmo.png', 'image/png')).json() as { poster_url: string };
    expect(first.poster_url).not.toBe(second.poster_url);
    expect(await readdir(directory)).toContain(path.basename(first.poster_url));
    expect(await readdir(directory)).toContain(path.basename(second.poster_url));
  });
  it('filme inexistente não deixa arquivo', async () => {
    model.findByPk.mockResolvedValue(null);
    const before = await readdir(directory);
    const response = await send(png, 'poster.png', 'image/png');
    expect(response.status).toBe(404); await response.text(); expect(await readdir(directory)).toEqual(before);
  });
  it('falha ao persistir remove o arquivo novo', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    movie.update.mockRejectedValue(new Error('database unavailable'));
    const before = await readdir(directory);
    const response = await send(png, 'poster.png', 'image/png');
    expect(response.status).toBe(500); await response.text(); expect(await readdir(directory)).toEqual(before);
    logged.mockRestore();
  });
});
