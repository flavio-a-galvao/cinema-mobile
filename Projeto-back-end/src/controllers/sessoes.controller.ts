import { Request, Response } from "express";
import Sessao from "../models/Sessao";

import Filme from '../models/Filme';
import Sala from '../models/Sala';
import Ingresso from '../models/Ingresso';
import sequelize from '../config/database';
import type { Transaction } from 'sequelize';
class SessionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

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

  private static async validate(body: SessaoPayload | undefined, creating: boolean, transaction?: Transaction, previous?: Sessao) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SessionError(400, 'Informe os dados da sessão.');
    for (const key of ['id_filme', 'id_sala'] as const) {
      if (creating || body[key] !== undefined) {
        if (!Number.isSafeInteger(body[key]) || Number(body[key]) <= 0) throw new SessionError(400, 'Selecione um filme e uma sala válidos.');
        const record = key === 'id_filme' ? await Filme.findByPk(body[key], { transaction }) : await Sala.findByPk(body[key], { transaction });
        if (!record) throw new SessionError(400, key === 'id_filme' ? 'Filme não encontrado.' : 'Sala não encontrada.');
      }
    }
    if (creating || body.preco !== undefined) {
      if (!['number', 'string'].includes(typeof body.preco) || !/^\d+(?:\.\d{1,2})?$/.test(String(body.preco)) || Number(body.preco) > 9999.99) throw new SessionError(400, 'Informe um preço entre 0 e 9999,99, com até duas casas decimais.');
    }
    if (creating || body.horario !== undefined) {
      const value = body.horario;
      const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(value) : null;
      if (!match || !Number.isFinite(Date.parse(value!))) throw new SessionError(400, 'Informe data e horário válidos.');
      const calendar = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      if (calendar.toISOString().slice(0, 10) !== value!.slice(0, 10) || Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6] ?? 0) > 59) throw new SessionError(400, 'Informe data e horário válidos.');
      const time = Date.parse(value!);
      const unchanged = previous?.horario && new Date(previous.horario).getTime() === time;
      if (!unchanged && time <= Date.now()) throw new SessionError(400, 'A sessão deve começar em uma data e horário futuros.');
    }
  }

  private static reply(error: unknown, res: Response) {
    if (error instanceof SessionError) return res.status(error.status).json({ message: error.message });
    if (SessoesController.isForeignKeyConstraintError(error)) return res.status(409).json({ message: 'Filme ou sala indisponível. Atualize as opções e tente novamente.' });
    throw error;
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
    try {
      await SessoesController.validate(req.body, true);
      const sessao = await Sessao.create(SessoesController.toPayload(req.body));
      return res.status(201).json(sessao);
    } catch (error) { return SessoesController.reply(error, res); }
  }

  static async update(req: Request, res: Response) {
    try {
      const sessao = await sequelize.transaction(async transaction => {
        const session = await Sessao.findByPk(Number(req.params.id), { transaction, lock: transaction.LOCK.UPDATE });
        if (!session) throw new SessionError(404, SessoesController.NOT_FOUND_MESSAGE);
        await SessoesController.validate(req.body, false, transaction, session);
        const changesLocation = (req.body.id_sala !== undefined && req.body.id_sala !== session.id_sala)
          || (req.body.id_filme !== undefined && req.body.id_filme !== session.id_filme);
        if (changesLocation && await Ingresso.count({ where: { id_sessao: session.id_sessao }, transaction })) {
          throw new SessionError(409, 'Não é possível trocar filme ou sala de uma sessão com ingressos no histórico.');
        }
        await session.update(SessoesController.toPayload(req.body), { transaction });
        return session;
      });
      return res.status(200).json(sessao);
    } catch (error) { return SessoesController.reply(error, res); }
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