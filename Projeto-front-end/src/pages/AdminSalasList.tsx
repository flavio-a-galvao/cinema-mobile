import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminPagination from "../componentes/common/AdminPagination";
import AdminNav from "../componentes/common/AdminNav";
import { api } from "../services/api";
import type { ListPayload, PaginationMeta, PagedResponse, Sala } from "../types";
import "./AdminFilmes.css";

const PAGE_LIMIT = 6;

function parseListPayload<T>(payload: ListPayload<T>, fallbackPage: number): { data: T[]; meta: PaginationMeta } {
  const asPaged = payload as PagedResponse<T>;
  const data = Array.isArray(asPaged?.data) ? asPaged.data : Array.isArray(payload) ? payload : [];
  const pagination = asPaged?.pagination || {};

  return {
    data,
    meta: {
      page: Number(pagination.page || fallbackPage),
      totalPages: Math.max(1, Number(pagination.totalPages || 1)),
      total: Number(pagination.total || data.length),
    },
  };
}

function AdminSalasList() {
  const navigate = useNavigate();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  async function load(page = 1) {
    setLoading(true);
    try {
      const payload = await api.get<ListPayload<Sala>>(`/salas?page=${page}&limit=${PAGE_LIMIT}`);
      const normalized = parseListPayload(payload, page);
      setSalas(normalized.data);
      setMeta(normalized.meta);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel carregar salas.";
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remover(id: number) {
    if (!window.confirm("Tem certeza que deseja remover esta sala?")) return;
    try {
      await api.delete<void>(`/salas/${id}`);
      setFeedback("Sala removida com sucesso.");
      await load(meta.page);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel remover a sala.";
      setFeedback(message);
    }
  }

  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>Salas</h2>
        <AdminNav />

        <div className="admin-acoes-form">
          <button type="button" onClick={() => navigate("/admin/salas/nova")}>Cadastrar nova sala</button>
        </div>

        {feedback && <p className="feedback sucesso">{feedback}</p>}
        {loading && <p>Carregando salas...</p>}

        {!loading && (
          <div className="admin-simples-grid">
            {salas.map((sala) => (
              <article key={sala.id_sala} className="admin-simples-item">
                <h4>{sala.nome || `Sala ${sala.id_sala}`}</h4>
                <p><strong>Capacidade:</strong> {sala.capacidade} lugares</p>
                <div className="admin-filme-botoes">
                  <Link to={`/admin/salas/${sala.id_sala}/editar`}><button type="button">Editar</button></Link>
                  <button type="button" className="btn-remover" onClick={() => remover(sala.id_sala)}>Remover</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && <AdminPagination meta={meta} onChange={(nextPage) => load(nextPage)} />}
      </section>
    </main>
  );
}

export default AdminSalasList;
