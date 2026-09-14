/**
 * Constantes da aplicação - Evita Magic Numbers
 * Facilita manutenção centralizada de valores padrão
 */

// ========================
// PAGINAÇÃO
// ========================
export const PAGINACAO = {
  PAGINA_INICIAL: 1,
  ITENS_POR_PAGINA_PADRAO: 10,
  LIMITE_MAXIMO_ITENS: 100,
} as const;

// ========================
// AUTENTICAÇÃO
// ========================
export const AUTENTICACAO = {
  JWT_EXPIRACAO: "24h",
  JWT_ALGORITMO: "HS256",
  TIPO_ADMIN: "admin",
  TIPO_CLIENTE: "cliente",
} as const;

// ========================
// VALIDAÇÃO
// ========================
export const VALIDACAO = {
  COMPRIMENTO_MINIMO_SENHA: 8,
  TAMANHO_CPF: 11,
  TAMANHO_CNPJ: 14,
} as const;

// ========================
// CÓDIGOS HTTP PADRÃO
// ========================
export const CODIGOS_HTTP = {
  SUCESSO: 200,
  CRIADO: 201,
  REQUISICAO_INVALIDA: 400,
  NAO_AUTORIZADO: 401,
  PROIBIDO: 403,
  NAO_ENCONTRADO: 404,
  ERRO_INTERNO: 500,
} as const;

// ========================
// MENSAGENS DE ERRO
// ========================
export const MENSAGENS_ERRO = {
  AUTENTICACAO: {
    TOKEN_FALTANDO: "Token de autenticação não informado.",
    TOKEN_INVALIDO: "Token inválido ou expirado.",
    CREDENCIAIS_INVALIDAS: "Email ou senha inválidos.",
  },
  VALIDACAO: {
    CAMPOS_OBRIGATORIOS: "Todos os campos obrigatórios devem ser preenchidos.",
    EMAIL_INVALIDO: "Email inválido.",
    SENHA_FRACA: "Senha deve ter pelo menos 8 caracteres, letra maiúscula, número e símbolo.",
    CPF_INVALIDO: "CPF inválido.",
  },
  NAO_ENCONTRADO: {
    USUARIO: "Usuário não encontrado.",
    FILME: "Filme não encontrado.",
    SALA: "Sala não encontrada.",
    SESSAO: "Sessão não encontrada.",
    INGRESSO: "Ingresso não encontrado.",
    PAGAMENTO: "Pagamento não encontrado.",
    ASSENTO: "Assento não encontrado.",
    CLIENTE: "Cliente não encontrado.",
  },
  PERMISSAO: {
    ADMIN_REQUERIDO: "Acesso restrito para administradores.",
  },
} as const;

// ========================
// MENSAGENS DE SUCESSO
// ========================
export const MENSAGENS_SUCESSO = {
  CRIADO: "Registro criado com sucesso.",
  ATUALIZADO: "Registro atualizado com sucesso.",
  REMOVIDO: "Registro removido com sucesso.",
  LOGIN_SUCESSO: "Login realizado com sucesso.",
} as const;
