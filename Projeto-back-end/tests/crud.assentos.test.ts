import { beforeEach, describe, expect, it, vi } from "vitest";
import AssentosController from "../src/controllers/assentos.controller";
import Assento from "../src/models/Assento";

vi.mock("../src/models/Assento", () => ({
  default: {
    findAll: vi.fn(),
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

describe("💺 CRUD DE ASSENTOS", () => {
  beforeEach(() => vi.clearAllMocks());

  it("✅ SUCESSO: deve listar assentos", async () => {
    (Assento as any).findAll.mockResolvedValue([]);

    const req = {};
    const res = createResponse();

    await AssentosController.findAll(req as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("✅ SUCESSO: deve buscar assento por id", async () => {
    const assento = { id_assento: 1, fila: "A", numero: 10 };
    (Assento as any).findByPk.mockResolvedValue(assento);

    const req = { params: { id: "1" } };
    const res = createResponse();

    await AssentosController.getById(req as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(assento);
  });

  it("✅ SUCESSO: deve criar assento", async () => {
    const assento = { id_assento: 1, fila: "A", numero: 10, id_sala: 1 };
    (Assento as any).create.mockResolvedValue(assento);

    const req = { body: { id_sala: 1, fila: "A", numero: 10 } };
    const res = createResponse();

    await AssentosController.create(req as any, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(assento);
  });
});
