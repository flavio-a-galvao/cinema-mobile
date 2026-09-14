import { describe, it, expect, vi, beforeEach } from "vitest";
import FilmesController from "../src/controllers/filmes.controller";
import Filme from "../src/models/Filme";

vi.mock("../src/models/Filme", () => ({
    default: {
        findAndCountAll: vi.fn(),
        findByPk: vi.fn(),
    },
}));

function createResponse() {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis() };
    return res;
}

describe("🎬 TESTES DE CRUDS (FILMES, SALAS, SESSOES)", () => {
    beforeEach(() => vi.clearAllMocks());

    it("✅ SUCESSO: Deve suportar paginação na listagem de filmes", async () => {
        (Filme as any).findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        const req = { query: { page: "1", limit: "10" } };
        const res = createResponse();
        await FilmesController.findAll(req as any, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("❌ SABOTAGEM CRUD: Deve retornar 404 ao tentar editar filme inexistente", async () => {
        // Simula que o filme não existe no banco (retorna null)
        (Filme as any).findByPk.mockResolvedValue(null);
        const req = { params: { id: "999" }, body: { titulo: "Novo" } };
        const res = createResponse();
        
        try {
            await FilmesController.update(req as any, res);
            // Se a segurança estiver ativa, o status deve ser 404
            expect(res.status, "⚠️ O SISTEMA NÃO RETORNOU 404 PARA RECURSO INEXISTENTE!").toHaveBeenCalledWith(404);
        } catch (error) {
            // Se o código explodir por falta de verificação, mostramos a mensagem clara:
            throw new Error("⚠️ SABOTAGEM DETECTADA: O sistema tentou editar um recurso que não existe e o código explodiu!");
        }
    });
});
