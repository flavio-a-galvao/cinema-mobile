import sequelize from '../config/database';
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
    const result = await sequelize.transaction(async transaction => {
    const { id_ingresso } = req.body;
    const ingresso = await Ingresso.findByPk(Number(id_ingresso), { transaction, lock: transaction.LOCK.UPDATE });
    if (!ingresso) return { status: 400, body: { message: "Ingresso invalido para pagamento." } };
    if (ingresso.get('status') === 'cancelado') return { status: 409, body: { message: 'Ingresso cancelado não pode receber pagamento.' } };
    const email = await PagamentosController.clienteEmailOf(Number(ingresso.get("id_cliente")));
    const role = PagamentosController.normalizeRole(req);
    if (!PagamentosController.isAdmin(role) && email !== PagamentosController.normalizeEmail(req))
      return { status: 403, body: { message: "Voce nao pode registrar pagamento para outro usuario." } };
    const pagamento = await Pagamento.create(PagamentosController.buildPayload(req.body as Record<string, unknown>), { transaction });
    return { status: 201, body: pagamento };
    });
    return res.status(result.status).json(result.body);
  }
}

export default PagamentosController;