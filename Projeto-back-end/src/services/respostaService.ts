/**
 * Serviço centralizado para tratamento de respostas HTTP
 * Garante consistência nas respostas da API
 */

import { Response } from "express";

interface RespostaPadraoSucesso<T> {
  sucesso: true;
  dados: T;
  mensagem?: string;
  timestamp: string;
}

interface RespostaPadraoErro {
  sucesso: false;
  erro: string;
  mensagem: string;
  timestamp: string;
}

export class ServicoResposta {
  /**
   * Envia resposta de sucesso (200 OK)
   */
  static enviarSucesso<T>(res: Response, dados: T, mensagem?: string) {
    return res.status(200).json({
      sucesso: true,
      dados,
      mensagem,
      timestamp: new Date().toISOString(),
    } as RespostaPadraoSucesso<T>);
  }

  /**
   * Envia resposta de criação (201 Created)
   */
  static enviarCriado<T>(res: Response, dados: T, mensagem?: string) {
    return res.status(201).json({
      sucesso: true,
      dados,
      mensagem,
      timestamp: new Date().toISOString(),
    } as RespostaPadraoSucesso<T>);
  }

  /**
   * Envia resposta de não encontrado (404 Not Found)
   */
  static enviarNaoEncontrado(res: Response, mensagem: string) {
    return res.status(404).json({
      sucesso: false,
      erro: "NAO_ENCONTRADO",
      mensagem,
      timestamp: new Date().toISOString(),
    } as RespostaPadraoErro);
  }

  /**
   * Envia resposta de validação inválida (400 Bad Request)
   */
  static enviarRequisicaoInvalida(res: Response, mensagem: string) {
    return res.status(400).json({
      sucesso: false,
      erro: "REQUISICAO_INVALIDA",
      mensagem,
      timestamp: new Date().toISOString(),
    } as RespostaPadraoErro);
  }

  /**
   * Envia resposta de acesso não autorizado (401 Unauthorized)
   */
  static enviarNaoAutorizado(res: Response, mensagem: string) {
    return res.status(401).json({
      sucesso: false,
      erro: "NAO_AUTORIZADO",
      mensagem,
      timestamp: new Date().toISOString(),
    } as RespostaPadraoErro);
  }

  /**
   * Envia resposta de acesso proibido (403 Forbidden)
   */
  static enviarProibido(res: Response, mensagem: string) {
    return res.status(403).json({
      sucesso: false,
      erro: "PROIBIDO",
      mensagem,
      timestamp: new Date().toISOString(),
    } as RespostaPadraoErro);
  }

  /**
   * Envia resposta de erro interno (500 Internal Server Error)
   */
  static enviarErroInterno(res: Response, mensagem: string = "Erro interno do servidor") {
    return res.status(500).json({
      sucesso: false,
      erro: "ERRO_INTERNO",
      mensagem,
      timestamp: new Date().toISOString(),
    } as RespostaPadraoErro);
  }
}

export default ServicoResposta;
