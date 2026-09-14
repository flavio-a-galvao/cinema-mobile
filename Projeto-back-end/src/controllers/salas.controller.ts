import { Request, Response } from "express";
import Sala from "../models/Sala";

class SalasController {
  private static readonly NOT_FOUND_MESSAGE = "Sala nao encontrada.";

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

  private static async findOrNotFound(id: number, res: Response) {
    const sala = await Sala.findByPk(id);
    if (!sala) {
      res.status(404).json({ message: SalasController.NOT_FOUND_MESSAGE });
      return null;
    }
    return sala;
  }

  static async findAll(req: Request, res: Response) {
    if (req.query.page === undefined && req.query.limit === undefined) {
      return res.status(200).json(await Sala.findAll({ order: [["id_sala", "DESC"]] }));
    }
    const { page, limit, offset } = SalasController.parsePagination(req.query);
    const { rows, count } = await Sala.findAndCountAll({ limit, offset, order: [["id_sala", "DESC"]] });
    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  }

  static async getById(req: Request, res: Response) {
    const sala = await SalasController.findOrNotFound(Number(req.params.id), res);
    if (!sala) return;
    return res.status(200).json(sala);
  }

  static async create(req: Request, res: Response) {
    const { nome, capacidade } = req.body;
    const sala = await Sala.create({ nome, capacidade });
    return res.status(201).json(sala);
  }

  static async update(req: Request, res: Response) {
    const sala = await SalasController.findOrNotFound(Number(req.params.id), res);
    if (!sala) return;
    await sala.update({ nome: req.body.nome, capacidade: req.body.capacidade });
    return res.status(200).json(sala);
  }

  static async delete(req: Request, res: Response) {
    const sala = await SalasController.findOrNotFound(Number(req.params.id), res);
    if (!sala) return;
    try {
      await sala.destroy();
      return res.status(200).json({ message: "Sala removida com sucesso." });
    } catch (error) {
      if (SalasController.isForeignKeyConstraintError(error)) {
        return res.status(409).json({ message: "Nao e possivel remover sala com sessoes ou assentos cadastrados." });
      }
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
}

export default SalasController;