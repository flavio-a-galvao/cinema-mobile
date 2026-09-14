import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth";

type AuthenticatedRequest = Request & {
  authUser?: {
    id_usuario: number;
    email: string;
    tipo_usuario: string;
  };
};

type JwtPayload = {
  id_usuario: number;
  email: string;
  tipo_usuario: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const request = req as AuthenticatedRequest;
  const authHeader = String(req.headers.authorization || "");
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token de autenticacao nao informado." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.authUser = {
      id_usuario: Number(payload.id_usuario),
      email: String(payload.email || ""),
      tipo_usuario: String(payload.tipo_usuario || ""),
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Token invalido ou expirado." });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const request = req as AuthenticatedRequest;
  const role = String(request.authUser?.tipo_usuario || "").toLowerCase();

  if (role !== "admin" && role !== "adm") {
    return res.status(403).json({ message: "Acesso restrito para administradores." });
  }

  return next();
}
