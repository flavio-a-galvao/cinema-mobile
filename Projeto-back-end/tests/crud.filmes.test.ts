import { beforeEach, describe, expect, it, vi } from "vitest";
import FilmesController from "../src/controllers/filmes.controller";
import Filme from "../src/models/Filme";

vi.mock("../src/models/Filme", () => ({
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
    send: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("🎬 CRUD DE FILMES", () => {
  beforeEach(() => vi.clearAllMocks());

  it("✅ SUCESSO: deve listar filmes com paginacao", async () => {
    (Filme as any).findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const req = { query: { page: "1", limit: "10" } };
    const res = createResponse();

    await FilmesController.findAll(req as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("❌ SABOTAGEM CRUD: deve retornar 404 ao atualizar filme inexistente", async () => {
    (Filme as any).findByPk.mockResolvedValue(null);

    const req = { params: { id: "999" }, body: { titulo: "Novo" } };
    const res = createResponse();

    await FilmesController.update(req as any, res);

    expect(res.status, "⚠️ O SISTEMA NAO RETORNOU 404 PARA FILME INEXISTENTE!").toHaveBeenCalledWith(404);
  });

  it("❌ SABOTAGEM CRUD: deve retornar 404 ao remover filme inexistente", async () => {
    (Filme as any).findByPk.mockResolvedValue(null);

    const req = { params: { id: "999" } };
    const res = createResponse();

    await FilmesController.delete(req as any, res);

    expect(res.status, "⚠️ O SISTEMA NAO RETORNOU 404 AO REMOVER FILME INEXISTENTE!").toHaveBeenCalledWith(404);
  });
});
