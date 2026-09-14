import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientesController from "../src/controllers/clientes.controller";
import Cliente from "../src/models/Cliente";

vi.mock("../src/models/Cliente", () => ({
  default: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
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

describe("👥 CRUD DE CLIENTES", () => {
  beforeEach(() => vi.clearAllMocks());

  it("✅ SUCESSO: deve listar clientes", async () => {
    (Cliente as any).findAll.mockResolvedValue([]);

    const req = {};
    const res = createResponse();

    await ClientesController.findAll(req as any, res);

    expect(res.send).toHaveBeenCalledWith([]);
  });

  it("❌ SABOTAGEM CADASTRO: deve bloquear criacao sem nome e email", async () => {
    const req = { body: { nome: "", email: "" } };
    const res = createResponse();

    await ClientesController.create(req as any, res);

    expect(res.status, "⚠️ O SISTEMA ACEITOU CADASTRO DE CLIENTE SEM NOME E EMAIL!").toHaveBeenCalledWith(400);
  });

  it("✅ SUCESSO: deve criar cliente quando dados forem validos", async () => {
    (Cliente as any).findOne.mockResolvedValue(null);
    (Cliente as any).create.mockResolvedValue({ id_cliente: 1, nome: "Cliente Teste" });

    const req = { body: { nome: "Cliente Teste", email: "cliente@mail.com", cpf: "123" } };
    const res = createResponse();

    await ClientesController.create(req as any, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
