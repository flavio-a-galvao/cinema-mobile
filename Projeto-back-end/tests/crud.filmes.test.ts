import { beforeEach, describe, expect, it, vi } from "vitest";
import FilmesController from "../src/controllers/filmes.controller";
import Filme from "../src/models/Filme";

vi.mock("../src/models/Filme", () => ({
  default: {
    findAndCountAll: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
}));

import { archiveSessions, CatalogSaleConflict } from '../src/services/catalogArchive';
vi.mock('../src/services/catalogArchive', () => ({
  archiveSessions: vi.fn().mockResolvedValue([]),
  publishArchivedSessions: vi.fn(),
  CatalogSaleConflict: class extends Error {},
  isCatalogLockConflict: vi.fn().mockReturnValue(false),
}));

vi.mock('../src/config/database', () => ({ default: { transaction: vi.fn(async callback => callback({ LOCK: { UPDATE: 'UPDATE', SHARE: 'SHARE' } })) } }));
vi.mock('../src/models/Sessao', () => ({ default: { findAll: vi.fn().mockResolvedValue([]) } }));
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


describe('Persistência do CRUD pelo model', () => {
  beforeEach(() => vi.clearAllMocks());
  it('cria usando somente os campos do filme', async () => {
    const payload = { titulo: 'Cinemax', genero: 'Ação', classificacao_etaria: '12', duracao: 120, sinopse: 'Uma história', data_lancamento: '2026-09-16', poster_url: null };
    (Filme as any).create.mockResolvedValue({ id_filme: 7, ...payload });
    const res = createResponse();
    await FilmesController.create({ body: { ...payload, id_filme: 999 } } as any, res);
    expect(Filme.create).toHaveBeenCalledWith(payload); expect(res.status).toHaveBeenCalledWith(201);
  });
  it('lê filme existente', async () => {
    const movie = { id_filme: 7, titulo: 'Cinemax' }; (Filme as any).findByPk.mockResolvedValue(movie);
    const res = createResponse(); await FilmesController.getById({ params: { id: '7' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200); expect(res.json).toHaveBeenCalledWith(movie);
  });
  it('atualiza filme existente pelo model', async () => {
    const movie = { update: vi.fn() }; (Filme as any).findByPk.mockResolvedValue(movie);
    const res = createResponse(); await FilmesController.update({ params: { id: '7' }, body: { titulo: 'Atualizado' } } as any, res);
    expect(movie.update).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Atualizado' })); expect(res.status).toHaveBeenCalledWith(200);
  });
  it('exclui pelo model', async () => {
    const movie = { destroy: vi.fn() }; (Filme as any).findByPk.mockResolvedValue(movie);
    const res = createResponse(); await FilmesController.delete({ params: { id: '7' } } as any, res);
    expect(movie.destroy).toHaveBeenCalledTimes(1); expect(res.status).toHaveBeenCalledWith(200);
  });
  it('preserva filme com ingressos vendidos, retornando 409', async () => {
    const movie = { destroy: vi.fn() }; (Filme as any).findByPk.mockResolvedValue(movie);
    vi.mocked(archiveSessions).mockRejectedValueOnce(new CatalogSaleConflict());
    const res = createResponse(); await FilmesController.delete({ params: { id: '7' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Nao e possivel remover filme com ingressos comprados' });
    expect(movie.destroy).not.toHaveBeenCalled();
  });
  it.each([{ titulo: '' }, { titulo: 'Teste', duracao: -1 }, { titulo: 'Teste', data_lancamento: '2026-02-30' }])('dados inválidos retornam 400', async body => {
    const res = createResponse(); await FilmesController.create({ body } as any, res);
    expect(res.status).toHaveBeenCalledWith(400); expect(Filme.create).not.toHaveBeenCalled();
  });
});

describe('Limites reais do MySQL',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it.each([['titulo',150],['genero',50],['classificacao_etaria',10]] as const)('valida limite de %s em criação e edição',async(field,limit)=>{
  const movie={update:vi.fn()}; (Filme.findByPk as any).mockResolvedValue(movie);
  for(const method of ['create','update'] as const){
   const res=createResponse(); await FilmesController[method]({params:{id:'1'},body:{titulo:'Filme',[field]:'x'.repeat(limit+1)}} as any,res);
   expect(res.status).toHaveBeenCalledWith(400);
  }
  expect(Filme.create).not.toHaveBeenCalled();expect(movie.update).not.toHaveBeenCalled();
  const res=createResponse(); await FilmesController.create({body:{titulo:'Filme',[field]:'x'.repeat(limit)}} as any,res);expect(res.status).toHaveBeenCalledWith(201);
 });
});
