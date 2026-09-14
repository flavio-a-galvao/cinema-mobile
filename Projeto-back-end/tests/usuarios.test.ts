import { describe, it, expect, vi, beforeEach } from "vitest";
import UsersController from "../src/controllers/users.controller";
import User from "../src/models/User";

vi.mock("../src/models/User", () => ({ default: { findOne: vi.fn(), create: vi.fn(), findByPk: vi.fn() } }));

function criarResposta() {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}

describe("🛡️ SEGURANÇA NO CADASTRO", () => {
  beforeEach(() => vi.clearAllMocks());

  it("❌ SABOTAGEM CPF: Deve bloquear CPF inválido", async () => {
    const res = criarResposta();
    const req = { body: { cpf: "123", nome: "Teste", email: "t@t.com", senha: "Abc@1234" } };
    try {
      await UsersController.create(req as any, res);
      expect(res.status, "⚠️ O SISTEMA ACEITOU UM CPF INVÁLIDO!").toHaveBeenCalledWith(400);
    } catch (error) {
      throw new Error("⚠️ SABOTAGEM DETECTADA: O sistema tentou processar um CPF inválido e falhou!");
    }
  });

  it("❌ SABOTAGEM EMAIL: Deve bloquear E-mail inválido no cadastro", async () => {
    const res = criarResposta();
    const req = { body: { cpf: "52998224725", nome: "Teste", email: "email-errado", senha: "Abc@1234" } };
    try {
      await UsersController.create(req as any, res);
      expect(res.status, "⚠️ O SISTEMA ACEITOU UM E-MAIL INVÁLIDO!").toHaveBeenCalledWith(400);
    } catch (error) {
      throw new Error("⚠️ SABOTAGEM DETECTADA: O sistema tentou processar um E-MAIL inválido e falhou!");
    }
  });

  it("✅ SUCESSO: Cadastro Válido", async () => {
    const dados = { id_usuario: 1, nome: "Teste", cpf: "52998224725" };
    const mockUser = { get: vi.fn((k: string) => (dados as any)[k]) };
    (User.findOne as any).mockResolvedValue(null);
    (User.create as any).mockResolvedValue(mockUser);
    const res = criarResposta();
    const req = { body: { cpf: "52998224725", nome: "Teste", email: "t@t.com", senha: "Abc@1234" } };
    await UsersController.create(req as any, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("❌ SABOTAGEM EDIÇÃO: Deve impedir alteração de e-mail na edição", async () => {
    (User.findByPk as any).mockResolvedValue({
        get: (field: string) => (field === "email" ? "atual@mail.com" : ""),
    });
    const res = criarResposta();
    const req = {
        params: { id: "1" },
        authUser: { id_usuario: 1, email: "atual@mail.com", tipo_usuario: "cliente" },
        body: { nome: "Nome", cpf: "52998224725", email: "novo@mail.com", senha: "Abc@1234" },
    };
    try {
      await UsersController.update(req as any, res);
      expect(res.status, "⚠️ O SISTEMA PERMITIU ALTERAR O E-MAIL!").toHaveBeenCalledWith(400);
    } catch (error) {
      throw new Error("⚠️ SABOTAGEM DETECTADA: O sistema permitiu uma alteração de e-mail proibida!");
    }
  });
});
