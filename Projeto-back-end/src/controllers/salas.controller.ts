import { ROOM_CAPACITY } from '../constants/roomLayout';
import { Request, Response } from "express";
import Sala from "../models/Sala";

import Assento from '../models/Assento';
import Sessao from '../models/Sessao';
import { archiveSessions, CatalogSaleConflict, isCatalogLockConflict, publishArchivedSessions } from '../services/catalogArchive';
import sequelize from '../config/database';
class RoomConflict extends Error {}

class SalasController {
  private static validate(body: Record<string, unknown> | undefined, creating: boolean): string | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Informe os dados da sala.';
    if ((creating || body.nome !== undefined) && (typeof body.nome !== 'string' || !body.nome.trim() || body.nome.length > 50)) return 'Informe um nome de até 50 caracteres.';
    if (body.capacidade !== undefined && body.capacidade !== ROOM_CAPACITY) return 'O mapa padrão possui capacidade fixa de 48 lugares.';
    return null;
  }

  private static readonly NOT_FOUND_MESSAGE = "Sala nao encontrada.";


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
    const error = SalasController.validate(req.body, true);
    if (error) return res.status(400).json({ message: error });
    const { nome } = req.body;
    const sala = await Sala.create({ nome, capacidade: ROOM_CAPACITY });
    return res.status(201).json(sala);
  }

  static async update(req: Request, res: Response) {
    const error = SalasController.validate(req.body, false);
    if (error) return res.status(400).json({ message: error });
    try {
      const sala = await sequelize.transaction(async transaction => {
        const room = await Sala.findByPk(Number(req.params.id), { transaction, lock: transaction.LOCK.UPDATE });
        if (!room) return null;
        if (ROOM_CAPACITY < await Assento.count({ where: { id_sala: room.id_sala }, transaction })) {
          throw new RoomConflict('Esta sala possui mais de 48 assentos e precisa de revisão manual. Nenhum dado foi alterado.');
        }
        await room.update({ nome: req.body.nome, capacidade: ROOM_CAPACITY }, { transaction });
        return room;
      });
      if (!sala) return res.status(404).json({ message: SalasController.NOT_FOUND_MESSAGE });
      return res.status(200).json(sala);
    } catch (error) {
      if (error instanceof RoomConflict) return res.status(409).json({ message: error.message });
      throw error;
    }
  }

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    try {
      const sessionIds = await sequelize.transaction(async transaction => {
        const sala = await Sala.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!sala) return null;
        const sessions = await Sessao.findAll({
          where: { id_sala: id }, order: [['id_sessao', 'ASC']], transaction, lock: transaction.LOCK.UPDATE,
        });
        const archived = await archiveSessions(sessions, transaction);
        await Assento.destroy({ where: { id_sala: id }, transaction });
        await sala.destroy({ transaction });
        return archived;
      });
      if (!sessionIds) return res.status(404).json({ message: SalasController.NOT_FOUND_MESSAGE });
      await publishArchivedSessions(sessionIds);
      return res.status(200).json({ message: "Sala removida com sucesso." });
    } catch (error) {
      if (error instanceof CatalogSaleConflict) return res.status(409).json({ message: error.message });
      if (isCatalogLockConflict(error)) return res.status(409).json({ message: 'A sala está em uso. Atualize e tente novamente.' });
      throw error;
    }
  }
}

export default SalasController;