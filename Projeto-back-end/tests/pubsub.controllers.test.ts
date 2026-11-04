import { beforeEach, expect, it, vi } from 'vitest';
import FilmesController from '../src/controllers/filmes.controller';
import SessoesController from '../src/controllers/sessoes.controller';
import Filme from '../src/models/Filme';
import Sessao from '../src/models/Sessao';
import sequelize from '../src/config/database';
import { catalogEvents } from '../src/services/catalogEvents';

vi.mock('../src/models/Filme', () => ({ default: { findByPk: vi.fn(), create: vi.fn() } }));
vi.mock('../src/models/Sessao', () => ({ default: { findByPk: vi.fn(), create: vi.fn() } }));
vi.mock('../src/models/Sala', () => ({ default: { findByPk: vi.fn(async () => ({})) } }));
vi.mock('../src/models/Ingresso', () => ({ default: { count: vi.fn(async () => 0) } }));
vi.mock('../src/config/database', () => ({ default: { transaction: vi.fn() } }));
const publish = vi.spyOn(catalogEvents, 'publish');
beforeEach(() => {
  vi.clearAllMocks();
  publish.mockResolvedValue(false); // Redis indisponível: resposta HTTP continua normal.
  vi.mocked(sequelize.transaction).mockImplementation(async (callback: any) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
});

it.each([
  { entity: 'filme', controller: FilmesController, model: Filme, body: { titulo: 'Novo' } },
  { entity: 'sessao', controller: SessoesController, model: Sessao, body: { id_filme: 1, id_sala: 1, preco: 20, horario: '2099-01-01T20:00:00Z' } },
] as const)('$entity: publica CRUD somente após sucesso e preserva respostas sem Redis', async ({ entity, controller, model, body }) => {
  const record = { id_filme: 7, id_sessao: 7, id_sala: 1, update: vi.fn(), destroy: vi.fn() };
  vi.mocked(Filme.findByPk).mockResolvedValue(record as any);
  vi.mocked(model.findByPk).mockResolvedValue(record as any);
  vi.mocked(model.create).mockResolvedValue(record as any);
  const req: any = { params: { id: '7' }, body };
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  await controller.create(req, res);
  expect(publish).toHaveBeenLastCalledWith(`${entity}.created`, 7);
  expect(res.status).toHaveBeenLastCalledWith(201);
  expect(vi.mocked(model.create).mock.invocationCallOrder[0]).toBeLessThan(publish.mock.invocationCallOrder[0]);
  await controller.update(req, res);
  expect(publish).toHaveBeenLastCalledWith(`${entity}.updated`, 7);
  expect(record.update.mock.invocationCallOrder[0]).toBeLessThan(publish.mock.invocationCallOrder[1]);
  expect(res.status).toHaveBeenLastCalledWith(200);
  await controller.delete(req, res);
  expect(publish).toHaveBeenLastCalledWith(`${entity}.deleted`, 7);
  expect(record.destroy.mock.invocationCallOrder[0]).toBeLessThan(publish.mock.invocationCallOrder[2]);
  expect(res.status).toHaveBeenLastCalledWith(200);
  expect(publish).toHaveBeenCalledTimes(3);

  record.destroy.mockRejectedValue(new Error('banco'));
  await controller.delete(req, res);
  expect(publish).toHaveBeenCalledTimes(3);
  expect(res.status).toHaveBeenLastCalledWith(500);
  record.update.mockRejectedValue(new Error('banco'));
  await expect(controller.update(req, res)).rejects.toThrow('banco');
  vi.mocked(model.create).mockRejectedValue(new Error('banco'));
  await expect(controller.create(req, res)).rejects.toThrow('banco');
  expect(publish).toHaveBeenCalledTimes(3);
  await controller.create({ body: {} } as any, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
  vi.mocked(model.findByPk).mockResolvedValue(null);
  await controller.delete(req, res);
  expect(res.status).toHaveBeenLastCalledWith(404);
  expect(publish).toHaveBeenCalledTimes(3);
});

it('não publica sessão se o commit da transação falhar após update', async () => {
  const record = { id_sessao: 7, update: vi.fn() };
  vi.mocked(Sessao.findByPk).mockResolvedValue(record as any);
  vi.mocked(sequelize.transaction).mockImplementation(async (callback: any) => {
    await callback({ LOCK: { UPDATE: 'UPDATE' } });
    throw new Error('commit falhou');
  });
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await expect(SessoesController.update({ params: { id: '7' }, body: { preco: 10 } } as any, res)).rejects.toThrow('commit falhou');
  expect(record.update).toHaveBeenCalled();
  expect(publish).not.toHaveBeenCalled();
});
