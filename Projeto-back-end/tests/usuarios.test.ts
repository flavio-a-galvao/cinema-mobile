import { describe, it, expect, vi, beforeEach } from "vitest";
import UsersController from "../src/controllers/users.controller";
import User from "../src/models/User";

vi.mock("../src/models/User", () => ({ default: { findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(), findByPk: vi.fn() } }));

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

describe('Privacidade dos usuários', () => {
 beforeEach(()=>vi.resetAllMocks());
 const data={id_usuario:1,nome:'Cliente',cpf:'52998224725',email:'t@t.com',senha:'HASH_SECRETO',hash:'HASH_SECRETO',tipo_usuario:'cliente'};
 const model=()=>({get:(key:string)=>(data as any)[key],update:vi.fn()});
 it.each(['findAll','getById','create','update'] as const)('%s nunca serializa credenciais',async method=>{
  (User.findAll as any).mockResolvedValue([model()]); (User.findByPk as any).mockResolvedValue(model());
  (User.findOne as any).mockResolvedValue(null); (User.create as any).mockResolvedValue(model());
  const res=criarResposta();
  await UsersController[method]({params:{id:'1'},authUser:{id_usuario:1,tipo_usuario:'admin'},body:{...data,senha:'Abc@1234'}} as any,res);
  const json=JSON.stringify(res.json.mock.calls[0][0]);
  expect(res.status).toHaveBeenCalledWith(method==='create'?201:200);
  expect(json).not.toMatch(/senha|hash|HASH_SECRETO|Abc@1234/i);
 });
 it('cliente não consulta outro usuário',async()=>{
  const res=criarResposta(); await UsersController.getById({params:{id:'2'},authUser:{id_usuario:1,tipo_usuario:'cliente'}} as any,res);
  expect(res.status).toHaveBeenCalledWith(403); expect(User.findByPk).not.toHaveBeenCalled();
 });
 it('cliente pode consultar somente seu próprio perfil sem senha',async()=>{
  (User.findByPk as any).mockResolvedValue(model()); const res=criarResposta();
  await UsersController.getById({params:{id:'1'},authUser:{id_usuario:1,tipo_usuario:'cliente'}} as any,res);
  expect(res.status).toHaveBeenCalledWith(200); expect(res.json.mock.calls[0][0]).not.toHaveProperty('senha');
 });
});
