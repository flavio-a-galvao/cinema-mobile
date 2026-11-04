import { beforeEach, expect, it, vi } from 'vitest';
import FilmesController from '../src/controllers/filmes.controller';
import SessoesController from '../src/controllers/sessoes.controller';
import Filme from '../src/models/Filme';
import Sessao from '../src/models/Sessao';
import { catalogCache } from '../src/services/catalogCache';

vi.mock('../src/models/Filme', () => ({ default: { findByPk: vi.fn(), create: vi.fn() } }));
vi.mock('../src/models/Sessao', () => ({ default: { findByPk: vi.fn(), create: vi.fn() } }));
vi.mock('../src/models/Sala', () => ({ default: { findByPk: vi.fn(async () => ({})) } }));
vi.mock('../src/models/Ingresso', () => ({ default: { count: vi.fn(async () => 0) } }));
vi.mock('../src/config/database', () => ({ default: { transaction: vi.fn(async callback => callback({ LOCK: { UPDATE: 'UPDATE' } })) } }));
const invalidate = vi.spyOn(catalogCache, 'invalidate');
beforeEach(() => vi.clearAllMocks());

it.each([
  { collection: 'filmes', controller: FilmesController, model: Filme, body: { titulo: 'Novo' } },
  { collection: 'sessoes', controller: SessoesController, model: Sessao, body: { id_filme: 1, id_sala: 1, preco: 20, horario: '2099-01-01T20:00:00Z' } },
])('$collection: CRUD administrativo invalida somente após persistência', async ({ collection, controller, model, body }) => {
  const record = { id_filme: 1, id_sala: 1, update: vi.fn(), destroy: vi.fn() };
  vi.mocked(Filme.findByPk).mockResolvedValue(record as any);
  vi.mocked(model.findByPk).mockResolvedValue(record as any);
  vi.mocked(model.create).mockResolvedValue(record as any);
  const req: any = { params: { id: '1' }, body };
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  await controller.create(req, res);
  expect(invalidate).toHaveBeenLastCalledWith(collection);
  expect(res.status).toHaveBeenLastCalledWith(201);
  await controller.update(req, res);
  expect(invalidate).toHaveBeenCalledTimes(2);
  expect(res.status).toHaveBeenLastCalledWith(200);
  await controller.delete(req, res);
  expect(invalidate).toHaveBeenCalledTimes(3);
  record.destroy.mockRejectedValue(new Error('banco'));
  await controller.delete(req, res);
  expect(invalidate).toHaveBeenCalledTimes(3);
  expect(res.status).toHaveBeenLastCalledWith(500);
});
