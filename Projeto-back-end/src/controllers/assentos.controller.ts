import { Request, Response } from "express";
import Assento from "../models/Assento";

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
    const assento = await Assento.create({ id_sala, numero, fila });
    return res.status(201).json(assento);
  }
}

export default AssentosController;