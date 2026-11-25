import { Request, Response } from "express";
import Assento from "../models/Assento";
import Sala from "../models/Sala";
import sequelize from "../config/database";

class AssentosController {
  static async findAll(req: Request, res: Response) {
    const assentos = await Assento.findAll();
    return res.status(200).json(assentos);
  }

  static async getById(req: Request, res: Response) {
    const assento = await Assento.findByPk(Number(req.params.id));
    if (!assento) {
      return res.status(404).json({ message: "Assento nao encontrado." });
    }
    return res.status(200).json(assento);
  }

  static async create(req: Request, res: Response) {
    const { id_sala, numero, fila } = req.body;
    const assento = await sequelize.transaction(async transaction => {
      if (!await Sala.findByPk(id_sala, { transaction, lock: transaction.LOCK.SHARE })) return null;
      return Assento.create({ id_sala, numero, fila }, { transaction });
    });
    if (!assento) return res.status(400).json({ message: 'Sala não encontrada.' });
    return res.status(201).json(assento);
  }
}

export default AssentosController;