import { Request, Response } from "express";
import Cliente from "../models/Cliente";
import Ingresso from "../models/Ingresso";
import Pagamento from "../models/Pagamento";

type AuthenticatedRequest = Request & {
  authUser?: {
    id_usuario: number;
    email: string;
    tipo_usuario: string;
  };
};

class PagamentosController {
  private static normalizeEmail(req: AuthenticatedRequest) {
    return String(req.authUser?.email || "").trim().toLowerCase();
  }

  private static normalizeRole(req: AuthenticatedRequest) {
    return String(req.authUser?.tipo_usuario || "").trim().toLowerCase();
  }

  private static isAdmin(role: string) {
    return role === "admin" || role === "adm";
  }

  private static async clienteEmailOf(idCliente: number): Promise<string> {
    const cliente = await Cliente.findByPk(idCliente);
    return String(cliente?.get("email") || "").trim().toLowerCase();
  }

  private static buildPayload(body: Record<string, unknown>) {
    const { id_ingresso, valor, metodo_pagamento, data_pagamento } = body;
    return { id_ingresso: Number(id_ingresso), valor, metodo_pagamento, data_pagamento };
  }

  static async findAll(req: Request, res: Response) {
    const pagamentos = await Pagamento.findAll();
    return res.status(200).json(pagamentos);
  }

  static async getById(req: Request, res: Response) {
    const pagamento = await Pagamento.findByPk(Number(req.params.id));
    return res.status(200).json(pagamento);
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const { id_ingresso } = req.body;
    const ingresso = await Ingresso.findByPk(Number(id_ingresso));
    if (!ingresso) return res.status(400).json({ message: "Ingresso invalido para pagamento." });
    const email = await PagamentosController.clienteEmailOf(Number(ingresso.get("id_cliente")));
    const role = PagamentosController.normalizeRole(req);
    if (!PagamentosController.isAdmin(role) && email !== PagamentosController.normalizeEmail(req))
      return res.status(403).json({ message: "Voce nao pode registrar pagamento para outro usuario." });
    const pagamento = await Pagamento.create(PagamentosController.buildPayload(req.body as Record<string, unknown>));
    return res.status(201).json(pagamento);
  }
}

export default PagamentosController;