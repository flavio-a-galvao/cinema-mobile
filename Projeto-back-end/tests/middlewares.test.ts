import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth, requireAdmin } from "../src/middlewares/auth.middleware";
import { JWT_SECRET } from "../src/config/auth";

function createResponse() {
    const res: any = {};
    res.status = vi.fn().mockImplementation((code) => {
        res.statusCode = code;
        return res;
    });
    res.json = vi.fn().mockImplementation((payload) => {
        res.payload = payload;
        return res;
    });
    return res;
}

describe("🛡️ TESTES DE MIDDLEWARES", () => {
    it("retorna 401 no requireAdmin sem usuário autenticado", () => {
        const res = createResponse();
        const next = vi.fn();

        requireAdmin({} as any, res as any, next);

        expect(res.statusCode).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it.each(["funcionario", "adm", "ADMIN", "Admin", ""])(
        "retorna 403 para o perfil '%s'",
        (tipo_usuario) => {
            const req = { authUser: { id_usuario: 1, email: "user@mail.com", tipo_usuario } };
            const res = createResponse();
            const next = vi.fn();

            requireAdmin(req as any, res as any, next);

            expect(res.statusCode).toBe(403);
            expect(next).not.toHaveBeenCalled();
        },
    );

    it("permite admin autenticado por JWT válido", () => {
        const token = jwt.sign(
            { id_usuario: 1, email: "admin@mail.com", tipo_usuario: "admin" },
            JWT_SECRET,
            { expiresIn: "1h" },
        );
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = createResponse();
        const next = vi.fn();

        requireAuth(req as any, res as any, () => {
            requireAdmin(req as any, res as any, next);
        });

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("bloqueia requisição sem token", () => {
        const req = { headers: {} };
        const res = createResponse();
        const next = vi.fn();
        requireAuth(req as any, res as any, next);
        
        expect(res.statusCode, "⚠️ O MIDDLEWARE DEIXOU PASSAR SEM TOKEN!").toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("bloqueia acesso admin para usuário comum", () => {
        const req = {
            authUser: { id_usuario: 1, email: "user@mail.com", tipo_usuario: "cliente" },
        };
        const res = createResponse();
        const next = vi.fn();
        requireAdmin(req as any, res as any, next);
        
        expect(res.statusCode, "⚠️ O MIDDLEWARE PERMITIU CLIENTE ACESSAR ÁREA ADMIN!").toBe(403);
        expect(next).not.toHaveBeenCalled();
    });
});
