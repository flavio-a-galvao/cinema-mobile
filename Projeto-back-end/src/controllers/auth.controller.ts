import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/auth";
import { isValidEmail } from "../utils/validators";

interface LoginBody {
  email?: string;
  senha?: string;
}

interface LoginInput {
  email: string;
  senha: string;
}

interface AuthPayload {
  id_usuario: number;
  email: string;
  tipo_usuario: string;
}

class AuthController {
  private static readonly INVALID_CREDENTIALS_MESSAGE = "Email ou senha invalidos.";

  private static normalizeLogin(body: LoginBody): LoginInput {
    return {
      email: String(body.email || "").trim().toLowerCase(),
      senha: String(body.senha || ""),
    };
  }

  private static isLoginInputValid(input: LoginInput, res: Response): boolean {
    if (!input.email || !input.senha) {
      res.status(400).json({ message: "Email e senha sao obrigatorios." });
      return false;
    }

    if (!isValidEmail(input.email)) {
      res.status(400).json({ message: "Email invalido." });
      return false;
    }

    return true;
  }

  private static buildPayload(user: User): AuthPayload {
    return {
      id_usuario: Number(user.get("id_usuario")),
      email: String(user.get("email")),
      tipo_usuario: String(user.get("tipo_usuario")),
    };
  }

  private static async hasValidPassword(user: User, plainPassword: string): Promise<boolean> {
    const senhaHash = String(user.get("senha") || "");
    if (!senhaHash.startsWith("$2")) return false;
    return bcrypt.compare(plainPassword, senhaHash);
  }

  private static buildAuthResponse(user: User, token: string) {
    return {
      token,
      user: {
        id_usuario: Number(user.get("id_usuario")),
        nome: String(user.get("nome") || ""),
        email: String(user.get("email") || ""),
        tipo_usuario: String(user.get("tipo_usuario") || "cliente"),
      },
    };
  }

  static async login(req: Request, res: Response) {
    const input = AuthController.normalizeLogin(req.body as LoginBody);
    if (!AuthController.isLoginInputValid(input, res)) return;

    const user = await User.findOne({ where: { email: input.email } });
    if (!user) {
      return res.status(401).json({ message: AuthController.INVALID_CREDENTIALS_MESSAGE });
    }

    const senhaValida = await AuthController.hasValidPassword(user, input.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: AuthController.INVALID_CREDENTIALS_MESSAGE });
    }

    const payload = AuthController.buildPayload(user);

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json(AuthController.buildAuthResponse(user, token));
  }
}

export default AuthController;
