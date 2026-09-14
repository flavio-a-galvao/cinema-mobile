import { Request, Response } from "express";
import Cliente from "../models/Cliente";

type AuthenticatedRequest = Request & {
  authUser?: {
    id_usuario: number;
    email: string;
    tipo_usuario: string;
  };
};

class ClientesController {
  private static readonly REQUIRED_MESSAGE = "Nome e email sao obrigatorios.";

  private static normalizeEmail(value: unknown): string {
    return String(value || "").trim().toLowerCase();
  }

  private static normalizeName(value: unknown): string {
    return String(value || "").trim();
  }

  private static hasRequiredFields(nome: string, email: string): boolean {
    return Boolean(nome && email);
  }

  private static async upsertByEmail(
    email: string,
    nome: string,
    cpf: unknown,
    telefone: unknown,
    dataNascimento: unknown,
  ) {
    const clienteExistente = await Cliente.findOne({ where: { email } });

    if (clienteExistente) {
      await clienteExistente.update({
        nome,
        telefone: telefone ?? clienteExistente.get("telefone"),
        data_nascimento: dataNascimento ?? clienteExistente.get("data_nascimento"),
      });
      return { cliente: clienteExistente, created: false };
    }

    const cliente = await Cliente.create({
      nome,
      cpf,
      email,
      telefone,
      data_nascimento: dataNascimento,
    });

    return { cliente, created: true };
  }

  static async findAll(req: Request, res: Response) {
    const clientes = await Cliente.findAll();

    return res.send(clientes);
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(Number(id));

    return res.send(cliente);
  }

  static async create(req: Request, res: Response) {
    const { nome, cpf, email, telefone, data_nascimento } = req.body;

    const nomeNormalizado = ClientesController.normalizeName(nome);
    const emailNormalizado = ClientesController.normalizeEmail(email);
    if (!ClientesController.hasRequiredFields(nomeNormalizado, emailNormalizado)) {
      return res.status(400).json({ message: ClientesController.REQUIRED_MESSAGE });
    }

    const upsertResult = await ClientesController.upsertByEmail(
      emailNormalizado,
      nomeNormalizado,
      cpf,
      telefone,
      data_nascimento,
    );

    return res.status(upsertResult.created ? 201 : 200).json(upsertResult.cliente);
  }

  static async getMyProfile(req: AuthenticatedRequest, res: Response) {
    const email = ClientesController.normalizeEmail(req.authUser?.email);
    const cliente = await Cliente.findOne({ where: { email } });

    if (!cliente) {
      return res.status(404).json({ message: "Cliente nao encontrado para o usuario autenticado." });
    }

    return res.status(200).json(cliente);
  }

  static async upsertMyProfile(req: AuthenticatedRequest, res: Response) {
    const email = ClientesController.normalizeEmail(req.authUser?.email);
    const nome = ClientesController.normalizeName(req.body?.nome);
    const telefone = req.body?.telefone;
    const data_nascimento = req.body?.data_nascimento;

    if (!ClientesController.hasRequiredFields(nome, email)) {
      return res.status(400).json({ message: ClientesController.REQUIRED_MESSAGE });
    }

    const upsertResult = await ClientesController.upsertByEmail(email, nome, undefined, telefone, data_nascimento);
    return res.status(upsertResult.created ? 201 : 200).json(upsertResult.cliente);
  }
}

export default ClientesController;