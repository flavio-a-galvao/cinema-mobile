import { Request, Response } from "express";
import { Model, Op } from "sequelize";
import Assento from "../models/Assento";
import Cliente from "../models/Cliente";
import Filme from "../models/Filme";
import Ingresso from "../models/Ingresso";
import Pagamento from "../models/Pagamento";
import Sessao from "../models/Sessao";

type AuthenticatedRequest = Request & {
  authUser?: {
    id_usuario: number;
    email: string;
    tipo_usuario: string;
  };
};

interface ResourceMaps {
  pagamentosMap: Map<number, Model>;
  sessoesMap: Map<number, Model>;
  filmesMap: Map<number, Model>;
  assentosMap: Map<number, Model>;
}

class ComprasController {
  private static async getClienteIds(email: string): Promise<number[]> {
    const clientes = await Cliente.findAll({ where: { email } });
    return clientes.map((c) => Number(c.get("id_cliente"))).filter((id) => id > 0);
  }

  private static fetchIngressos(clienteIds: number[]) {
    return Ingresso.findAll({
      where: { id_cliente: { [Op.in]: clienteIds } },
      order: [["data_compra", "DESC"]],
    });
  }

  private static async buildResourceMaps(ingressos: Model[]): Promise<ResourceMaps> {
    const ingressoIds = ingressos.map((i) => Number(i.get("id_ingresso")));
    const sessaoIds = [...new Set(ingressos.map((i) => Number(i.get("id_sessao"))))];
    const assentoIds = [...new Set(ingressos.map((i) => Number(i.get("id_assento"))))];
    const [pagamentos, sessoes, assentos] = await Promise.all([
      Pagamento.findAll({ where: { id_ingresso: { [Op.in]: ingressoIds } } }),
      Sessao.findAll({ where: { id_sessao: { [Op.in]: sessaoIds } } }),
      Assento.findAll({ where: { id_assento: { [Op.in]: assentoIds } } }),
    ]);
    const filmeIds = [...new Set(sessoes.map((s) => Number(s.get("id_filme"))))];
    const filmes = await Filme.findAll({ where: { id_filme: { [Op.in]: filmeIds } } });
    return {
      pagamentosMap: new Map(pagamentos.map((p) => [Number(p.get("id_ingresso")), p])),
      sessoesMap: new Map(sessoes.map((s) => [Number(s.get("id_sessao")), s])),
      filmesMap: new Map(filmes.map((f) => [Number(f.get("id_filme")), f])),
      assentosMap: new Map(assentos.map((a) => [Number(a.get("id_assento")), a])),
    };
  }

  private static buildPurchaseItem(ingresso: Model, maps: ResourceMaps) {
    const idIngresso = Number(ingresso.get("id_ingresso"));
    const sessao = maps.sessoesMap.get(Number(ingresso.get("id_sessao")));
    const filme = sessao ? maps.filmesMap.get(Number(sessao.get("id_filme"))) : null;
    const assento = maps.assentosMap.get(Number(ingresso.get("id_assento")));
    const pagamento = maps.pagamentosMap.get(idIngresso);
    return {
      id: idIngresso,
      filme: String(filme?.get("titulo") || "Filme nao encontrado"),
      sessao: sessao?.get("horario")
        ? new Date(String(sessao.get("horario"))).toLocaleString("pt-BR")
        : "Horario nao informado",
      assento: assento
        ? `${String(assento.get("fila") || "")}${String(assento.get("numero") || "")}`.trim()
        : `ID ${Number(ingresso.get("id_assento"))}`,
      valor: Number(pagamento?.get("valor") || 0),
      metodo: String(pagamento?.get("metodo_pagamento") || "Nao informado"),
      dataCompra: ingresso.get("data_compra")
        ? new Date(String(ingresso.get("data_compra"))).toLocaleString("pt-BR")
        : "Data nao informada",
    };
  }

  static async findMyPurchases(req: AuthenticatedRequest, res: Response) {
    const email = String(req.authUser?.email || "").trim().toLowerCase();
    if (!email) return res.status(401).json({ message: "Usuario nao autenticado." });
    const clienteIds = await ComprasController.getClienteIds(email);
    if (clienteIds.length === 0) return res.status(200).json([]);
    const ingressos = await ComprasController.fetchIngressos(clienteIds);
    if (ingressos.length === 0) return res.status(200).json([]);
    const maps = await ComprasController.buildResourceMaps(ingressos);
    const compras = ingressos.map((i) => ComprasController.buildPurchaseItem(i, maps));
    return res.status(200).json(compras);
  }
}

export default ComprasController;