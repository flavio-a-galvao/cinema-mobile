import { beforeEach, describe, expect, it, vi } from "vitest";
import IngressosController from "../src/controllers/ingressos.controller";
import Assento from "../src/models/Assento";
import Cliente from "../src/models/Cliente";
import Ingresso from "../src/models/Ingresso";
import Sessao from "../src/models/Sessao";

vi.mock("../src/models/Ingresso", () => ({
  default: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../src/models/Sessao", () => ({ default: { findByPk: vi.fn() } }));
vi.mock("../src/models/Cliente", () => ({ default: { findByPk: vi.fn() } }));
vi.mock("../src/models/Assento", () => ({ default: { findByPk: vi.fn() } }));

function createResponse() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("🎫 CRUD DE INGRESSOS", () => {
  beforeEach(() => vi.clearAllMocks());

  it("✅ SUCESSO: deve listar ingressos", async () => {
    (Ingresso as any).findAll.mockResolvedValue([]);

    const req = {};
    const res = createResponse();

    await IngressosController.findAll(req as any, res);

    expect(res.send).toHaveBeenCalledWith([]);
  });

  it("❌ SABOTAGEM COMPRA: deve bloquear criacao quando sessao, cliente ou assento forem invalidos", async () => {
    (Sessao as any).findByPk.mockResolvedValue(null);
    (Cliente as any).findByPk.mockResolvedValue(null);
    (Assento as any).findByPk.mockResolvedValue(null);

    const req = {
      body: { id_sessao: 1, id_cliente: 1, id_assento: 1, data_compra: "2026-03-30" },
      authUser: { id_usuario: 1, email: "user@mail.com", tipo_usuario: "cliente" },
    };
    const res = createResponse();

    await IngressosController.create(req as any, res);

    expect(res.status, "⚠️ O SISTEMA ACEITOU INGRESSO COM DADOS INVALIDOS!").toHaveBeenCalledWith(400);
  });

  it("✅ SUCESSO: deve criar ingresso quando dados forem validos", async () => {
    (Sessao as any).findByPk.mockResolvedValue({ id_sessao: 1, get: vi.fn((field: string) => (field === "id_sala" ? 1 : 1)) });
    (Assento as any).findByPk.mockResolvedValue({ id_assento: 1, get: vi.fn((field: string) => (field === "id_sala" ? 1 : 1)) });
    (Cliente as any).findByPk.mockResolvedValue({ get: vi.fn((field: string) => (field === "email" ? "user@mail.com" : 1)) });
    (Ingresso as any).findOne.mockResolvedValue(null);
    (Ingresso as any).create.mockResolvedValue({
      get: vi.fn((field: string) => {
        const map: any = {
          id_ingresso: 10,
          id_sessao: 1,
          id_cliente: 1,
          id_assento: 1,
          data_compra: "2026-03-30",
        };
        return map[field];
      }),
    });

    const req = {
      body: { id_sessao: 1, id_cliente: 1, id_assento: 1, data_compra: "2026-03-30" },
      authUser: { id_usuario: 1, email: "user@mail.com", tipo_usuario: "cliente" },
    };
    const res = createResponse();

    await IngressosController.create(req as any, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
