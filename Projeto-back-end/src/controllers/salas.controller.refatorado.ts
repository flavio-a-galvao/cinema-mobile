/**
 * ✅ EXEMPLO DE REFATORAÇÃO - SalasController com Clean Code
 *
 * Demonstra:
 * - Use de serviços centralizados
 * - Respostas HTTP padronizadas
 * - Métodos com responsabilidade única
 * - Nomes descritivos em português
 * - Tratamento de erros consistente
 */

import { Request, Response } from "express";
import Sala from "../models/Sala";
import { extrairPaginacao, formatarRespostaPaginada, temPaginacao } from "../utils/paginacaoHelper";
import { ServicoResposta } from "../services/respostaService";
import { ServicoValidacao } from "../services/validacaoService";
import { MENSAGENS_ERRO, MENSAGENS_SUCESSO } from "../constants/aplicacao";

class SalasControllerRefatorado {
  
  static async listarTodas(req: Request, res: Response) {
    try {
    
      if (!temPaginacao(req.query)) {
        const salas = await Sala.findAll();
        return ServicoResposta.enviarSucesso(res, salas);
      }

    
      const { pagina, limite, deslocamento } = extrairPaginacao(req.query);
      const { rows, count } = await Sala.findAndCountAll({
        limit: limite,
        offset: deslocamento,
      });

      const resposta = formatarRespostaPaginada(rows, count, pagina, limite);
      return ServicoResposta.enviarSucesso(res, resposta);
    } catch (erro) {
      return ServicoResposta.enviarErroInterno(res);
    }
  }

  
  static async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const idNumerico = this.validarIdNumerico(String(id));

      if (!idNumerico) {
        return ServicoResposta.enviarRequisicaoInvalida(res, "ID inválido");
      }

      const sala = await Sala.findByPk(idNumerico);

      if (!sala) {
        return ServicoResposta.enviarNaoEncontrado(
          res,
          MENSAGENS_ERRO.NAO_ENCONTRADO.SALA
        );
      }

      return ServicoResposta.enviarSucesso(res, sala);
    } catch (erro) {
      return ServicoResposta.enviarErroInterno(res);
    }
  }

 
  static async criar(req: Request, res: Response) {
    try {
      const { nome, capacidade } = req.body;

      // Valida campos obrigatórios
      const validacaoNome = ServicoValidacao.validarCampoObrigatorio(nome, "Nome");
      if (!validacaoNome.valido) {
        return ServicoResposta.enviarRequisicaoInvalida(res, validacaoNome.erro!);
      }

      const validacaoCapacidade = ServicoValidacao.validarCampoObrigatorio(
        capacidade,
        "Capacidade"
      );
      if (!validacaoCapacidade.valido) {
        return ServicoResposta.enviarRequisicaoInvalida(res, validacaoCapacidade.erro!);
      }

      // Normaliza dados
      const nomeSanitizado = ServicoValidacao.normalizarTexto(nome);

      // Cria a sala
      const sala = await Sala.create({
        nome: nomeSanitizado,
        capacidade: Number(capacidade),
      });

      return ServicoResposta.enviarCriado(
        res,
        sala,
        MENSAGENS_SUCESSO.CRIADO
      );
    } catch (erro) {
      return ServicoResposta.enviarErroInterno(res);
    }
  }

  /**
   * Atualiza uma sala existente
   * PUT /salas/:id
   */
  static async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, capacidade } = req.body;

      // Valida ID
      const idNumerico = this.validarIdNumerico(String(id));
      if (!idNumerico) {
        return ServicoResposta.enviarRequisicaoInvalida(res, "ID inválido");
      }

      // Busca a sala existente
      const sala = await Sala.findByPk(idNumerico);
      if (!sala) {
        return ServicoResposta.enviarNaoEncontrado(
          res,
          MENSAGENS_ERRO.NAO_ENCONTRADO.SALA
        );
      }

      // Valida e prepara dados para atualização
      const dadosAtualizacao = this.prepararDadosAtualizacao(nome, capacidade);

      // Atualiza
      await sala.update(dadosAtualizacao);

      return ServicoResposta.enviarSucesso(
        res,
        sala,
        MENSAGENS_SUCESSO.ATUALIZADO
      );
    } catch (erro) {
      return ServicoResposta.enviarErroInterno(res);
    }
  }

  /**
   * Deleta uma sala
   * DELETE /salas/:id
   */
  static async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Valida ID
      const idNumerico = this.validarIdNumerico(String(id));
      if (!idNumerico) {
        return ServicoResposta.enviarRequisicaoInvalida(res, "ID inválido");
      }

      // Busca a sala
      const sala = await Sala.findByPk(idNumerico);
      if (!sala) {
        return ServicoResposta.enviarNaoEncontrado(
          res,
          MENSAGENS_ERRO.NAO_ENCONTRADO.SALA
        );
      }

      // Verifica se há sessões associadas (exemplo de validação)
      // const temSessoes = await Sessao.count({ where: { id_sala: idNumerico } });
      // if (temSessoes > 0) {
      //   return ServicoResposta.enviarRequisicaoInvalida(
      //     res,
      //     "Não é possível deletar uma sala com sessões associadas"
      //   );
      // }

      // Deleta
      await sala.destroy();

      return ServicoResposta.enviarSucesso(
        res,
        { id: idNumerico },
        MENSAGENS_SUCESSO.REMOVIDO
      );
    } catch (erro) {
      return ServicoResposta.enviarErroInterno(res);
    }
  }

  // ========================
  // MÉTODOS PRIVADOS (Helpers)
  // ========================

  /**
   * Valida e converte ID para número
   */
  private static validarIdNumerico(id: string): number | null {
    const idNumerico = Number(id);
    return Number.isInteger(idNumerico) && idNumerico > 0 ? idNumerico : null;
  }

  /**
   * Prepara dados para atualização, mantendo valores existentes se não fornecidos
   */
  private static prepararDadosAtualizacao(nome?: string, capacidade?: number | string) {
    const dados: { nome?: string; capacidade?: number } = {};

    if (nome !== undefined && nome !== null) {
      dados.nome = ServicoValidacao.normalizarTexto(nome);
    }

    if (capacidade !== undefined && capacidade !== null) {
      dados.capacidade = Number(capacidade);
    }

    return dados;
  }
}

export default SalasControllerRefatorado;

/**
 * ========================
 * COMPARAÇÃO: ANTES vs DEPOIS
 * ========================
 *
 * ❌ ANTES (Original):
 * - 60 linhas de código
 * - Verificações de paginação misturadas com lógica de negócio
 * - Inconsistência em respostas (res.send() vs res.json())
 * - Magic numbers (1, 10, 100)
 * - Sem separação de responsabilidades
 *
 * ✅ DEPOIS (Refatorado):
 * - Mesmo funcionamento com código mais limpo
 * - Utiliza serviços centralizados (validação, resposta)
 * - Respostas padronizadas
 * - Métodos privados para lógica auxiliar
 * - Fácil de testar e manter
 * - Comentários explicativos
 * - Em português consistente
 */
