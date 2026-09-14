import { beforeEach, describe, expect, it, vi } from "vitest";
import SessoesController from "../src/controllers/sessoes.controller";
import Sessao from "../src/models/Sessao";

vi.mock("../src/models/Sessao", () => ({
  default: {
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));

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

    const req = { body: { id_filme: 1, id_sala: 1, horario: "2026-05-01T20:00:00", preco: 30 } };
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
