import { beforeEach, describe, expect, it, vi } from "vitest";
import PagamentosController from "../src/controllers/pagamentos.controller";
import Cliente from "../src/models/Cliente";
import Ingresso from "../src/models/Ingresso";
import Pagamento from "../src/models/Pagamento";

vi.mock("../src/models/Pagamento", () => ({
  default: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../src/models/Ingresso", () => ({ default: { findByPk: vi.fn() } }));
vi.mock("../src/models/Cliente", () => ({ default: { findByPk: vi.fn() } }));

function createResponse() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("💳 CRUD DE PAGAMENTOS", () => {
  beforeEach(() => vi.clearAllMocks());

  it("✅ SUCESSO: deve listar pagamentos", async () => {
    (Pagamento as any).findAll.mockResolvedValue([]);

    const req = {};
    const res = createResponse();

    await PagamentosController.findAll(req as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("❌ SABOTAGEM PAGAMENTO: deve bloquear pagamento para ingresso invalido", async () => {
    (Ingresso as any).findByPk.mockResolvedValue(null);

    const req = {
      body: { id_ingresso: 123, valor: 50, metodo_pagamento: "pix", data_pagamento: "2026-03-30" },
      authUser: { id_usuario: 1, email: "user@mail.com", tipo_usuario: "cliente" },
    };
    const res = createResponse();

    await PagamentosController.create(req as any, res);

    expect(res.status, "⚠️ O SISTEMA ACEITOU PAGAMENTO PARA INGRESSO INVALIDO!").toHaveBeenCalledWith(400);
  });

  it("✅ SUCESSO: deve criar pagamento com sucesso", async () => {
    (Ingresso as any).findByPk.mockResolvedValue({ get: vi.fn((field: string) => (field === "id_cliente" ? 1 : null)) });
    (Cliente as any).findByPk.mockResolvedValue({ get: vi.fn((field: string) => (field === "email" ? "user@mail.com" : null)) });
    (Pagamento as any).create.mockResolvedValue({ id_pagamento: 1, valor: 50 });

    const req = {
      body: { id_ingresso: 123, valor: 50, metodo_pagamento: "pix", data_pagamento: "2026-03-30" },
      authUser: { id_usuario: 1, email: "user@mail.com", tipo_usuario: "cliente" },
    };
    const res = createResponse();

    await PagamentosController.create(req as any, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
