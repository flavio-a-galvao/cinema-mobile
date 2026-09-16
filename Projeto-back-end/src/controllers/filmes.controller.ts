import { Request, Response } from "express";
import Filme from "../models/Filme";

interface FilmePayload {
  [key: string]: unknown;
  [key: symbol]: unknown;
  titulo?: string | null;
  genero?: string | null;
  classificacao_etaria?: string | null;
  duracao?: number | null;
  sinopse?: string | null;
  poster_url?: string | null;
  data_lancamento?: string | null;
}

class FilmesController {
  private static readonly NOT_FOUND_MESSAGE = "Filme nao encontrado.";

  private static isForeignKeyConstraintError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const err = error as { name?: string | null; original?: { code?: string } };
    return err.name === "SequelizeForeignKeyConstraintError" || err.original?.code === "ER_ROW_IS_REFERENCED_2";
  }

  private static parsePagination(query: Request["query"]) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
    return { page, limit, offset: (page - 1) * limit };
  }

  private static validate(body: FilmePayload | undefined, creating: boolean): string | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Informe os dados do filme.';
    if ((creating || body.titulo !== undefined) && (typeof body.titulo !== 'string' || !body.titulo.trim() || body.titulo.length > 255)) return 'Informe um título válido de até 255 caracteres.';
    for (const field of ['genero', 'classificacao_etaria', 'poster_url']) {
      const value = body[field];
      if (value != null && (typeof value !== 'string' || value.length > 255)) return 'Campo de texto inválido: ' + field;
    }
    if (body.sinopse != null && (typeof body.sinopse !== 'string' || Buffer.byteLength(body.sinopse, 'utf8') > 65535)) return 'Sinopse inválida.';
    if (body.duracao != null && (!Number.isInteger(body.duracao) || body.duracao <= 0 || body.duracao > 2147483647)) return 'Informe uma duração positiva em minutos.';
    if (body.data_lancamento != null && (typeof body.data_lancamento !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(body.data_lancamento) || !Number.isFinite(Date.parse(body.data_lancamento)) || new Date(body.data_lancamento).toISOString().slice(0, 10) !== body.data_lancamento.slice(0, 10))) return 'Informe uma data válida no formato AAAA-MM-DD.';
    return null;
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
    const error = FilmesController.validate(req.body, true);
    if (error) return res.status(400).json({ message: error });
    const filme = await Filme.create(FilmesController.toPayload(req.body as FilmePayload));
    return res.status(201).json(filme);
  }

  static async update(req: Request, res: Response) {
    const filme = await FilmesController.findOrNotFound(Number(req.params.id), res);
    if (!filme) return;

    const error = FilmesController.validate(req.body, false);
    if (error) return res.status(400).json({ message: error });
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
