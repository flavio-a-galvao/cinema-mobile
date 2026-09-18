import { beforeEach, describe, expect, it, vi } from "vitest";
import SalasController from "../src/controllers/salas.controller";
import Assento from '../src/models/Assento';
import Sala from "../src/models/Sala";

vi.mock("../src/models/Sala", () => ({
  default: {
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../src/models/Assento', () => ({ default: { count: vi.fn().mockResolvedValue(0) } }));
vi.mock('../src/config/database', () => ({ default: { transaction: vi.fn(async callback => callback({ LOCK: { UPDATE: 'UPDATE' } })) } }));

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


describe('Validação e integridade de salas', () => {
  beforeEach(() => { vi.clearAllMocks(); (Assento.count as any).mockResolvedValue(0); });
  it('edita nome e capacidade', async () => {
    const room = { id_sala: 1, update: vi.fn() }; (Sala.findByPk as any).mockResolvedValue(room);
    const res = createResponse();
    await SalasController.update({ params: { id: '1' }, body: { nome: 'Sala Coral', capacidade: 48 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200); expect(room.update).toHaveBeenCalledWith({ nome: 'Sala Coral', capacidade: 48 }, expect.anything());
  });
  it('exclui sala sem dependências', async () => {
    const room = { destroy: vi.fn() }; (Sala.findByPk as any).mockResolvedValue(room);
    const res = createResponse(); await SalasController.delete({ params: { id: '1' } } as any, res);
    expect(room.destroy).toHaveBeenCalledOnce(); expect(res.status).toHaveBeenCalledWith(200);
  });
  it('dependência impede exclusão com 409', async () => {
    (Sala.findByPk as any).mockResolvedValue({ destroy: vi.fn().mockRejectedValue({ name: 'SequelizeForeignKeyConstraintError' }) });
    const res = createResponse(); await SalasController.delete({ params: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  it('não reduz capacidade abaixo dos assentos existentes', async () => {
    const room = { id_sala: 1, update: vi.fn() }; (Sala.findByPk as any).mockResolvedValue(room); (Assento.count as any).mockResolvedValue(48);
    const res = createResponse(); await SalasController.update({ params: { id: '1' }, body: { capacidade: 20 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(409); expect(room.update).not.toHaveBeenCalled();
  });
  it.each([{ nome: '', capacidade: 48 }, { nome: 'Sala', capacidade: -1 }, { nome: 'Sala', capacidade: 2.5 }])('rejeita dados inválidos', async body => {
    const res = createResponse(); await SalasController.create({ body } as any, res);
    expect(res.status).toHaveBeenCalledWith(400); expect(Sala.create).not.toHaveBeenCalled();
  });
});

it('nome de sala respeita 50 caracteres na criação e edição',async()=>{
 vi.clearAllMocks();
 for(const method of ['create','update'] as const){const res=createResponse();await SalasController[method]({params:{id:'1'},body:{nome:'x'.repeat(51),capacidade:48}} as any,res);expect(res.status).toHaveBeenCalledWith(400);}
 expect(Sala.create).not.toHaveBeenCalled();const res=createResponse();await SalasController.create({body:{nome:'x'.repeat(50),capacidade:48}} as any,res);expect(res.status).toHaveBeenCalledWith(201);
});
