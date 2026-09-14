/**
 * Utilitário para parsear e validar parâmetros de paginação
 * Evita duplicação de código entre controllers
 */

interface ParametrosPaginacao {
  pagina: number;
  limite: number;
  deslocamento: number;
}

interface QueryPaginacao {
  page?: string | number;
  limit?: string | number;
}

const PAGINA_INICIAL = 1;
const LIMITE_PADRAO = 10;
const LIMITE_MAXIMO = 100;

/**
 * Extrai e valida os parâmetros de paginação do objeto de query
 *
 * @param query - Objeto com os parâmetros de paginação
 * @returns Objeto com pagina, limite e deslocamento validados
 *
 * @example
 * // req.query = { page: "2", limit: "20" }
 * const { pagina, limite, deslocamento } = extrairPaginacao(req.query);
 * // Resultado: { pagina: 2, limite: 20, deslocamento: 20 }
 */
export function extrairPaginacao(query: QueryPaginacao): ParametrosPaginacao {
  const pagina = Math.max(Number(query.page || PAGINA_INICIAL), PAGINA_INICIAL);
  const limite = Math.min(
    Math.max(Number(query.limit || LIMITE_PADRAO), PAGINA_INICIAL),
    LIMITE_MAXIMO
  );
  const deslocamento = (pagina - 1) * limite;

  return { pagina, limite, deslocamento };
}

/**
 * Formata a resposta paginada para retornar ao cliente
 *
 * @param dados - Array com os dados paginados
 * @param total - Total de registros na base de dados
 * @param pagina - Número da página atual
 * @param limite - Quantidade de itens por página
 * @returns Objeto formatado com dados e informações de paginação
 *
 * @example
 * const resposta = formatarRespostaPaginada(filmes, 100, 1, 10);
 * // Resultado: { dados: [...], paginacao: { pagina: 1, ... } }
 */
export function formatarRespostaPaginada<T>(
  dados: T[],
  total: number,
  pagina: number,
  limite: number
) {
  return {
    dados,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  };
}

/**
 * Verifica se a query contém parâmetros de paginação
 *
 * @param query - Objeto de query do request
 * @returns true se contém page ou limit
 */
export function temPaginacao(query: QueryPaginacao): boolean {
  return query.page !== undefined || query.limit !== undefined;
}
