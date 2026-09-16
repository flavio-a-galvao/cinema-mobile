import { beforeEach, describe, expect, it, vi } from "vitest";
import SessoesController from "../src/controllers/sessoes.controller";
import Filme from '../src/models/Filme';
import Sala from '../src/models/Sala';
import Ingresso from '../src/models/Ingresso';
import Sessao from "../src/models/Sessao";

vi.mock("../src/models/Sessao", () => ({
  default: {
    findAndCountAll: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../src/models/Filme', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../src/models/Sala', () => ({ default: { findByPk: vi.fn() } }));
vi.mock('../src/models/Ingresso', () => ({ default: { count: vi.fn() } }));
vi.mock('../src/config/database', () => ({ default: { transaction: vi.fn(async callback => callback({ LOCK: { UPDATE: 'UPDATE' } })) } }));
beforeEach(() => {
  vi.clearAllMocks();
  (Filme.findByPk as any).mockResolvedValue({ id_filme: 1 });
  (Sala.findByPk as any).mockResolvedValue({ id_sala: 1 });
  (Ingresso.count as any).mockResolvedValue(0);
});
const future = () => new Date(Date.now() + 86400000).toISOString();

function createResponse() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("🎟️ CRUD DE SESSOES", () => {
  beforeEach(() => vi.clearAllMocks());

  it("✅ SUCESSO: deve listar sessoes com paginacao", async () => {
    (Sessao as any).findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const req = { query: { page: "1", limit: "10" } };
    const res = createResponse();

    await SessoesController.findAll(req as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("✅ SUCESSO: deve criar sessao com sucesso", async () => {
    (Sessao as any).create.mockResolvedValue({ id_sessao: 1, id_filme: 1, id_sala: 1, preco: 30 });

    const req = { body: { id_filme: 1, id_sala: 1, horario: future(), preco: 30 } };
    const res = createResponse();

    await SessoesController.create(req as any, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("❌ SABOTAGEM CRUD: deve retornar 404 ao atualizar sessao inexistente", async () => {
    (Sessao as any).findByPk.mockResolvedValue(null);

    const req = { params: { id: "999" }, body: { preco: 50 } };
    const res = createResponse();

    await SessoesController.update(req as any, res);

    expect(res.status, "⚠️ O SISTEMA NAO RETORNOU 404 PARA SESSAO INEXISTENTE!").toHaveBeenCalledWith(404);
  });

  it("❌ SABOTAGEM CRUD: deve retornar 404 ao remover sessao inexistente", async () => {
    (Sessao as any).findByPk.mockResolvedValue(null);

    const req = { params: { id: "999" } };
    const res = createResponse();

    await SessoesController.delete(req as any, res);

    expect(res.status, "⚠️ O SISTEMA NAO RETORNOU 404 AO REMOVER SESSAO INEXISTENTE!").toHaveBeenCalledWith(404);
  });
});


describe('Validação e integridade de sessões', () => {
  it.each(['filme', 'sala'])('rejeita %s inexistente sem tentar gravar', async resource => {
    ((resource === 'filme' ? Filme.findByPk : Sala.findByPk) as any).mockResolvedValue(null);
    const res = createResponse(); await SessoesController.create({ body: { id_filme: 1, id_sala: 1, horario: future(), preco: 25 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400); expect(Sessao.create).not.toHaveBeenCalled();
  });
  it('edita sessão sem ingressos', async () => {
    const session = { id_sessao: 1, id_filme: 1, id_sala: 1, update: vi.fn() }; (Sessao.findByPk as any).mockResolvedValue(session);
    const res = createResponse(); await SessoesController.update({ params: { id: '1' }, body: { preco: 40 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200); expect(session.update).toHaveBeenCalledWith(expect.objectContaining({ preco: 40 }), expect.anything());
  });
  it('preserva sala e filme de sessão com histórico', async () => {
    const session = { id_sessao: 1, id_filme: 1, id_sala: 1, update: vi.fn() }; (Sessao.findByPk as any).mockResolvedValue(session); (Ingresso.count as any).mockResolvedValue(1);
    const res = createResponse(); await SessoesController.update({ params: { id: '1' }, body: { id_sala: 2 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(409); expect(session.update).not.toHaveBeenCalled();
  });
  it('exclui sessão sem ingressos', async () => {
    const session = { destroy: vi.fn() }; (Sessao.findByPk as any).mockResolvedValue(session);
    const res = createResponse(); await SessoesController.delete({ params: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200); expect(session.destroy).toHaveBeenCalledOnce();
  });
  it('dependências retornam 409, sem apagar ingressos', async () => {
    (Sessao.findByPk as any).mockResolvedValue({ destroy: vi.fn().mockRejectedValue({ name: 'SequelizeForeignKeyConstraintError' }) });
    const res = createResponse(); await SessoesController.delete({ params: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  it.each(['2099-02-30T20:00:00Z', '2099-01-01T25:00:00Z', '2000-01-01T20:00:00Z', 'não é data'])('rejeita horário inválido %s', async horario => {
    const res = createResponse(); await SessoesController.create({ body: { id_filme: 1, id_sala: 1, horario, preco: 20 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400); expect(Sessao.create).not.toHaveBeenCalled();
  });
  it.each([-1, 10000, 1.234, null])('rejeita preço inválido %s', async preco => {
    const res = createResponse(); await SessoesController.create({ body: { id_filme: 1, id_sala: 1, horario: future(), preco } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('FK removida concorrentemente retorna 409', async () => {
    (Sessao.create as any).mockRejectedValueOnce({ name: 'SequelizeForeignKeyConstraintError' });
    const res = createResponse(); await SessoesController.create({ body: { id_filme: 1, id_sala: 1, horario: future(), preco: 20 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  it('a sessão gravada é retornada pela listagem pública usada pelo cliente', async () => {
    const session = { id_sessao: 19, id_filme: 1, id_sala: 1, horario: future(), preco: 20 };
    (Sessao.create as any).mockResolvedValue(session);
    const createResponseValue = createResponse(); await SessoesController.create({ body: session } as any, createResponseValue);
    (Sessao.findAll as any).mockResolvedValue([session]);
    const res = createResponse(); await SessoesController.findAll({ query: {} } as any, res);
    expect(createResponseValue.status).toHaveBeenCalledWith(201); expect(res.json).toHaveBeenCalledWith([session]);
  });
});
