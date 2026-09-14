import { Request, Response } from "express";
import Assento from "../models/Assento";
import Cliente from "../models/Cliente";
import Ingresso from "../models/Ingresso";
import Sessao from "../models/Sessao";

type AuthenticatedRequest = Request & {
  authUser?: {
    id_usuario: number;
    email: string;
    tipo_usuario: string;
  };
};

class IngressosController {
  private static normalizeText(value: unknown): string {
    return String(value || "").trim().toLowerCase();
  }

  private static isAdmin(role: string): boolean {
    return role === "admin" || role === "adm";
  }

  private static async hasValidDependencies(idSessao: number, idCliente: number, idAssento: number) {
    const sessao = await Sessao.findByPk(idSessao);
    const cliente = await Cliente.findByPk(idCliente);
    const assento = await Assento.findByPk(idAssento);

    const valid = Boolean(sessao && cliente && assento && assento.get("id_sala") === sessao.get("id_sala"));

    return { sessao, cliente, assento, valid };
  }

  private static serializeIngresso(ingresso: Ingresso) {
    return {
      id_ingresso: Number(ingresso.get("id_ingresso")),
      id_sessao: Number(ingresso.get("id_sessao")),
      id_cliente: Number(ingresso.get("id_cliente")),
      id_assento: Number(ingresso.get("id_assento")),
      data_compra: ingresso.get("data_compra"),
    };
  }

  static async findAll(req: Request, res: Response) {
    const ingressos = await Ingresso.findAll();

    return res.send(ingressos);
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const ingresso = await Ingresso.findByPk(Number(id));

    return res.send(ingresso);
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const { id_sessao, id_cliente, id_assento, data_compra } = req.body;
    const emailAutenticado = IngressosController.normalizeText(req.authUser?.email);
    const role = IngressosController.normalizeText(req.authUser?.tipo_usuario);
    const idSessao = Number(id_sessao);
    const idCliente = Number(id_cliente);
    const idAssento = Number(id_assento);

    const dependencies = await IngressosController.hasValidDependencies(idSessao, idCliente, idAssento);
    if (!dependencies.valid) {
      return res.status(400).json({ message: "Sessao, cliente ou assento invalido." });
    }

    const existingIngresso = await Ingresso.findOne({
      where: { id_sessao: idSessao, id_assento: idAssento },
    });
    if (existingIngresso) {
      return res.status(400).json({ message: "Assento ja ocupado nesta sessao." });
    }

    const ingresso = await Ingresso.create({
      id_sessao: idSessao,
      id_cliente: idCliente,
      id_assento: idAssento,
      data_compra,
    });

    return res.status(201).json(IngressosController.serializeIngresso(ingresso));
  }
}

export default IngressosController;