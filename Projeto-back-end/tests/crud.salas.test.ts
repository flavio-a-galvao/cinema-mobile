import { beforeEach, describe, expect, it, vi } from "vitest";
import SalasController from "../src/controllers/salas.controller";
import Sala from "../src/models/Sala";

vi.mock("../src/models/Sala", () => ({
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

describe("🏛️ CRUD DE SALAS", () => {
  beforeEach(() => vi.clearAllMocks());

  it("✅ SUCESSO: deve listar salas com paginacao", async () => {
    (Sala as any).findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const req = { query: { page: "1", limit: "10" } };
    const res = createResponse();

    await SalasController.findAll(req as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("✅ SUCESSO: deve criar sala com sucesso", async () => {
    (Sala as any).create.mockResolvedValue({ id_sala: 1, nome: "Sala 1", capacidade: 80 });

    const req = { body: { nome: "Sala 1", capacidade: 80 } };
    const res = createResponse();

    await SalasController.create(req as any, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("❌ SABOTAGEM CRUD: deve retornar 404 ao atualizar sala inexistente", async () => {
    (Sala as any).findByPk.mockResolvedValue(null);

    const req = { params: { id: "999" }, body: { nome: "Sala X", capacidade: 100 } };
    const res = createResponse();

    await SalasController.update(req as any, res);

    expect(res.status, "⚠️ O SISTEMA NAO RETORNOU 404 PARA SALA INEXISTENTE!").toHaveBeenCalledWith(404);
  });

  it("❌ SABOTAGEM CRUD: deve retornar 404 ao remover sala inexistente", async () => {
    (Sala as any).findByPk.mockResolvedValue(null);

    const req = { params: { id: "999" } };
    const res = createResponse();

    await SalasController.delete(req as any, res);

    expect(res.status, "⚠️ O SISTEMA NAO RETORNOU 404 AO REMOVER SALA INEXISTENTE!").toHaveBeenCalledWith(404);
  });
});
