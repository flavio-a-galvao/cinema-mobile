import { Request, Response } from "express";
import Sessao from "../models/Sessao";

interface SessaoPayload {
  [key: string]: unknown;
  [key: symbol]: unknown;
  id_filme?: number;
  id_sala?: number;
  horario?: string;
  preco?: number;
}

class SessoesController {
  private static readonly NOT_FOUND_MESSAGE = "Sessao nao encontrada.";

  private static isForeignKeyConstraintError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const err = error as { name?: string; original?: { code?: string } };
    return err.name === "SequelizeForeignKeyConstraintError" || err.original?.code === "ER_ROW_IS_REFERENCED_2";
  }

  private static parsePagination(query: Request["query"]) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    return { page, limit, offset: (page - 1) * limit };
  }

  private static toPayload(body: SessaoPayload): SessaoPayload {
    const { id_filme, id_sala, horario, preco } = body;
    return { id_filme, id_sala, horario, preco };
  }

  private static async findOrNotFound(id: number, res: Response) {
    const sessao = await Sessao.findByPk(id);
    if (!sessao) {
      res.status(404).json({ message: SessoesController.NOT_FOUND_MESSAGE });
      return null;
    }
    return sessao;
  }

  static async findAll(req: Request, res: Response) {
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

    if (!hasPagination) {
      const sessoes = await Sessao.findAll();
      return res.status(200).json(sessoes);
    }

    const { page, limit, offset } = SessoesController.parsePagination(req.query);
    const { rows, count } = await Sessao.findAndCountAll({ limit, offset });

    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  }

  static async getById(req: Request, res: Response) {
    const sessao = await SessoesController.findOrNotFound(Number(req.params.id), res);
    if (!sessao) return;

    return res.status(200).json(sessao);
  }

  static async create(req: Request, res: Response) {
    const sessao = await Sessao.create(SessoesController.toPayload(req.body as SessaoPayload));
    return res.status(201).json(sessao);
  }

  static async update(req: Request, res: Response) {
    const sessao = await SessoesController.findOrNotFound(Number(req.params.id), res);
    if (!sessao) return;

    await sessao.update(SessoesController.toPayload(req.body as SessaoPayload));
    return res.status(200).json(sessao);
  }

  static async delete(req: Request, res: Response) {
    const sessao = await SessoesController.findOrNotFound(Number(req.params.id), res);
    if (!sessao) return;
    try {
      await sessao.destroy();
      return res.status(200).json({ message: "Sessao removida com sucesso." });
    } catch (error) {
      if (SessoesController.isForeignKeyConstraintError(error)) {
        return res.status(409).json({ message: "Nao e possivel remover sessao com ingressos cadastrados." });
      }
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
}

export default SessoesController;