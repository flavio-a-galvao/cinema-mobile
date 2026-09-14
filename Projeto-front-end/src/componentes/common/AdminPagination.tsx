import type { PaginationMeta } from "../../types";

interface AdminPaginationProps {
  meta: PaginationMeta;
  onChange: (nextPage: number) => void;
}

function AdminPagination({ meta, onChange }: AdminPaginationProps) {
  const atual = Number(meta?.page || 1);
  const totalPaginas = Math.max(1, Number(meta?.totalPages || 1));
  const totalRegistros = Number(meta?.total || 0);

  return (
    <div className="admin-paginacao">
      <span className="admin-paginacao-info">
        Pagina {atual} de {totalPaginas} ({totalRegistros} registros)
      </span>
      <div className="admin-paginacao-botoes">
        <button type="button" onClick={() => onChange(atual - 1)} disabled={atual <= 1}>
          Anterior
        </button>
        <button type="button" onClick={() => onChange(atual + 1)} disabled={atual >= totalPaginas}>
          Proxima
        </button>
      </div>
    </div>
  );
}

export default AdminPagination;
