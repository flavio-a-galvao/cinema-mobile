import { Request, Response } from "express";
import Filme from "../models/Filme";

interface FilmePayload {
  [key: string]: unknown;
  [key: symbol]: unknown;
  titulo?: string;
  genero?: string;
  classificacao_etaria?: string;
  duracao?: number;
  sinopse?: string;
  poster_url?: string;
  data_lancamento?: string;
}

class FilmesController {
  private static readonly NOT_FOUND_MESSAGE = "Filme nao encontrado.";

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

  private static toPayload(body: FilmePayload): FilmePayload {
    const {
      titulo,
      genero,
      classificacao_etaria,
      duracao,
      sinopse,
      poster_url,
      data_lancamento,
    } = body;

    return { titulo, genero, classificacao_etaria, duracao, sinopse, poster_url, data_lancamento };
  }

  private static async findOrNotFound(id: number, res: Response) {
    const filme = await Filme.findByPk(id);
    if (!filme) {
      res.status(404).json({ message: FilmesController.NOT_FOUND_MESSAGE });
      return null;
    }
    return filme;
  }

  static async findAll(req: Request, res: Response) {
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

    if (!hasPagination) {
      const filmes = await Filme.findAll();
      return res.status(200).json(filmes);
    }

    const { page, limit, offset } = FilmesController.parsePagination(req.query);
    const { rows, count } = await Filme.findAndCountAll({ limit, offset });

    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  }

  static async getById(req: Request, res: Response) {
    const filme = await FilmesController.findOrNotFound(Number(req.params.id), res);
    if (!filme) return;

    return res.status(200).json(filme);
  }

  static async create(req: Request, res: Response) {
    const filme = await Filme.create(FilmesController.toPayload(req.body as FilmePayload));
    return res.status(201).json(filme);
  }

  static async update(req: Request, res: Response) {
    const filme = await FilmesController.findOrNotFound(Number(req.params.id), res);
    if (!filme) return;

    await filme.update(FilmesController.toPayload(req.body as FilmePayload));

    return res.status(200).json(filme);
  }

  static async delete(req: Request, res: Response) {
    const filme = await FilmesController.findOrNotFound(Number(req.params.id), res);
    if (!filme) return;
    try {
      await filme.destroy();
      return res.status(200).json({ message: "Filme removido com sucesso." });
    } catch (error) {
      if (FilmesController.isForeignKeyConstraintError(error)) {
        return res.status(409).json({ message: "Nao e possivel remover filme com sessoes cadastradas." });
      }
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  }
}

export default FilmesController;
