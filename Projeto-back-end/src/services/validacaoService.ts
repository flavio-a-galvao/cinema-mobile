/**
 * Serviço de validação centralizado
 * Evita duplicação de validações em vários places
 */

import { isValidEmail, isStrongPassword, isValidCPF } from "../utils/validators";

interface ResultadoValidacao {
  valido: boolean;
  erro?: string;
}

export class ServicoValidacao {
  /**
   * Valida um email
   */
  static validarEmail(email: string): ResultadoValidacao {
    if (!email || typeof email !== "string") {
      return { valido: false, erro: "Email é obrigatório" };
    }

    const emailNormalizado = String(email || "").trim().toLowerCase();

    if (!isValidEmail(emailNormalizado)) {
      return { valido: false, erro: "Email inválido" };
    }

    return { valido: true };
  }

  /**
   * Valida uma senha
   */
  static validarSenha(senha: string): ResultadoValidacao {
    if (!senha || typeof senha !== "string") {
      return { valido: false, erro: "Senha é obrigatória" };
    }

    if (!isStrongPassword(senha)) {
      return {
        valido: false,
        erro: "Senha deve ter pelo menos 8 caracteres, letra maiúscula, número e símbolo",
      };
    }

    return { valido: true };
  }

  /**
   * Valida um CPF
   */
  static validarCPF(cpf: string): ResultadoValidacao {
    if (!cpf || typeof cpf !== "string") {
      return { valido: false, erro: "CPF é obrigatório" };
    }

    const cpfLimpo = cpf.replace(/\D/g, "");

    if (!isValidCPF(cpfLimpo)) {
      return { valido: false, erro: "CPF inválido" };
    }

    return { valido: true };
  }

  /**
   * Valida se um campo está preenchido
   */
  static validarCampoObrigatorio(
    valor: string | number | boolean | null | undefined,
    nomeCampo: string,
  ): ResultadoValidacao {
    if (valor === undefined || valor === null || valor === "") {
      return { valido: false, erro: `${nomeCampo} é obrigatório` };
    }

    return { valido: true };
  }

  /**
   * Normaliza um email para formato padrão
   */
  static normalizarEmail(email: string): string {
    return String(email || "").trim().toLowerCase();
  }

  /**
   * Normaliza um texto removendo espaços desnecessários
   */
  static normalizarTexto(texto: string): string {
    return String(texto || "").trim();
  }
}

export default ServicoValidacao;
