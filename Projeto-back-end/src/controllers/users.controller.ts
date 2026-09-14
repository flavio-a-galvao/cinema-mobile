import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { isStrongPassword, isValidCPF, isValidEmail } from "../utils/validators";

interface UserRequestBody {
    nome?: string;
    cpf?: string;
    email?: string;
    senha?: string;
    tipo_usuario?: string;
}

interface NormalizedUserInput {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
}

type AuthenticatedRequest = Request & {
    authUser?: {
        id_usuario: number;
        email: string;
        tipo_usuario: string;
    };
};

class UsersController {
    private static readonly REQUIRED_FIELDS_MESSAGE = "Nome, cpf, email e senha sao obrigatorios.";
    private static readonly WEAK_PASSWORD_MESSAGE = "Senha fraca. Use no minimo 8 caracteres com maiuscula, minuscula, numero e simbolo.";

    private static normalizeInput(body: UserRequestBody): NormalizedUserInput {
        return {
            nome: String(body.nome || "").trim(),
            cpf: String(body.cpf || "").replace(/\D/g, ""),
            email: String(body.email || "").trim().toLowerCase(),
            senha: String(body.senha || ""),
        };
    }

    private static hasRequiredFields(input: NormalizedUserInput): boolean {
        return Boolean(input.nome && input.cpf && input.email && input.senha);
    }

    private static isInputValid(input: NormalizedUserInput, res: Response): boolean {
        if (!UsersController.hasRequiredFields(input)) {
            res.status(400).json({ message: UsersController.REQUIRED_FIELDS_MESSAGE });
            return false;
        }

        if (!isValidCPF(input.cpf)) {
            res.status(400).json({ message: "CPF invalido." });
            return false;
        }

        if (!isValidEmail(input.email)) {
            res.status(400).json({ message: "Email invalido." });
            return false;
        }

        if (!isStrongPassword(input.senha)) {
            res.status(400).json({ message: UsersController.WEAK_PASSWORD_MESSAGE });
            return false;
        }

        return true;
    }

    private static serializeUser(user: User) {
        return {
            id_usuario: user.get("id_usuario"),
            nome: user.get("nome"),
            cpf: user.get("cpf"),
            email: user.get("email"),
            tipo_usuario: user.get("tipo_usuario"),
            data_criacao: user.get("data_criacao"),
        };
    }

    private static async findByIdOrNotFound(id: number, res: Response) {
        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: "Usuario nao encontrado." });
            return null;
        }

        return user;
    }

    private static canEditOwnProfile(authUserId: number, targetId: number): boolean {
        return Boolean(authUserId && authUserId === targetId);
    }

    private static async ensureUniqueForCreate(input: NormalizedUserInput, res: Response): Promise<boolean> {
        const emailExists = await User.findOne({ where: { email: input.email } });
        if (emailExists) {
            res.status(409).json({ message: "Este email ja esta cadastrado." });
            return false;
        }

        const cpfExists = await User.findOne({ where: { cpf: input.cpf } });
        if (cpfExists) {
            res.status(409).json({ message: "Este CPF ja esta cadastrado." });
            return false;
        }

        return true;
    }

    private static emailWasChanged(user: User, nextEmail: string): boolean {
        const currentEmail = String(user.get("email") || "").toLowerCase();
        return nextEmail !== currentEmail;
    }

    private static async isCpfInUseByAnotherUser(cpf: string, targetId: number): Promise<boolean> {
        const cpfOwner = await User.findOne({ where: { cpf } });
        return Boolean(cpfOwner && Number(cpfOwner.get("id_usuario")) !== targetId);
    }

    private static async hashPassword(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, 10);
    }

    static async findAll(req: Request, res: Response) {
        const users = await User.findAll();

        return res.status(200).json(users);
    }

    static async getById(req: Request, res: Response) {
        const user = await UsersController.findByIdOrNotFound(Number(req.params.id), res);
        if (!user) return;

        return res.status(200).json(user);
    }

    static async create(req: Request, res: Response) {
        const payload = req.body as UserRequestBody;
        const input = UsersController.normalizeInput(payload);
        if (!UsersController.isInputValid(input, res)) return;
        if (!(await UsersController.ensureUniqueForCreate(input, res))) return;

        const senhaHash = await UsersController.hashPassword(input.senha);

        const user = await User.create({
            nome: input.nome,
            cpf: input.cpf,
            email: input.email,
            senha: senhaHash,
            tipo_usuario: payload.tipo_usuario,
        });

        return res.status(201).json(UsersController.serializeUser(user));
    }

    static async update(req: AuthenticatedRequest, res: Response) {
        const authUserId = Number(req.authUser?.id_usuario || 0);
        const targetId = Number(req.params.id || 0);

        if (!UsersController.canEditOwnProfile(authUserId, targetId)) {
            return res.status(403).json({ message: "Voce so pode editar seu proprio usuario." });
        }

        const input = UsersController.normalizeInput(req.body as UserRequestBody);
        if (!UsersController.isInputValid(input, res)) return;

        const user = await UsersController.findByIdOrNotFound(targetId, res);
        if (!user) return;

        if (UsersController.emailWasChanged(user, input.email)) {
            return res.status(400).json({ message: "O email nao pode ser alterado." });
        }

        if (await UsersController.isCpfInUseByAnotherUser(input.cpf, targetId)) {
            return res.status(409).json({ message: "Este CPF ja esta cadastrado." });
        }

        const senhaHash = await UsersController.hashPassword(input.senha);
        await user.update({
            nome: input.nome,
            cpf: input.cpf,
            senha: senhaHash,
        });

        return res.status(200).json(UsersController.serializeUser(user));
    }

}

export default UsersController;