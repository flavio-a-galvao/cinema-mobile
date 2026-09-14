import { describe, it, expect, vi } from "vitest";
import AuthController from "../src/controllers/auth.controller";

function createResponse() {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    return res;
}

describe("🔑 SEGURANÇA NO LOGIN", () => {
  it("❌ SABOTAGEM LOGIN: Deve bloquear se o e-mail for inválido", async () => {
    const res = createResponse();
    const req = { body: { email: "email-errado", senha: "123" } };
    
    try {
      await AuthController.login(req as any, res);
      // Se a validação estiver ativa, deve ser 400. 
      // Se sabotar, o código vai tentar ir pro banco e o teste vai pegar a falha aqui:
      expect(res.status, "⚠️ O LOGIN PASSOU COM E-MAIL INVÁLIDO! A VALIDAÇÃO FOI SABOTADA.").toHaveBeenCalledWith(400);
    } catch (error) {
      throw new Error("⚠️ SABOTAGEM DETECTADA: O login processou um e-mail inválido e tentou acessar o banco!");
    }
  });

  it("✅ ESTRUTURA: O Controller de Login deve estar definido", () => {
    expect(AuthController.login).toBeDefined();
  });
});
