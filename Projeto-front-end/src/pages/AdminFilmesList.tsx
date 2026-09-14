import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminPagination from "../componentes/common/AdminPagination";
import AdminNav from "../componentes/common/AdminNav";
import { api } from "../services/api";
import type { Filme, ListPayload, PaginationMeta, PagedResponse } from "../types";
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

function AdminFilmesList() {
  const navigate = useNavigate();
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  async function load(page = 1) {
    setLoading(true);
    try {
      const payload = await api.get<ListPayload<Filme>>(`/filmes?page=${page}&limit=${PAGE_LIMIT}`);
      const normalized = parseListPayload(payload, page);
      setFilmes(normalized.data);
      setMeta(normalized.meta);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel carregar filmes.";
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remover(id: number) {
    if (!window.confirm("Tem certeza que deseja remover este filme?")) return;
    try {
      await api.delete<void>(`/filmes/${id}`);
      setFeedback("Filme removido com sucesso.");
      await load(meta.page);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel remover o filme.";
      setFeedback(message);
    }
  }

  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>Filmes</h2>
        <AdminNav />

        <div className="admin-acoes-form">
          <button type="button" onClick={() => navigate("/admin/filmes/novo")}>Cadastrar novo filme</button>
        </div>

        {feedback && <p className="feedback sucesso">{feedback}</p>}
        {loading && <p>Carregando filmes...</p>}

        {!loading && (
          <div className="admin-filmes-grid">
            {filmes.map((filme) => (
              <article key={filme.id_filme} className="admin-filme-item">
                <img src={filme.poster_url || "https://i.imgur.com/8w1NikM.jpg"} alt={filme.titulo} />
                <div>
                  <h4>{filme.titulo}</h4>
                  <p><strong>Genero:</strong> {filme.genero || "-"}</p>
                  <p><strong>Duracao:</strong> {filme.duracao ? `${filme.duracao} min` : "-"}</p>
                </div>
                <div className="admin-filme-botoes">
                  <Link to={`/admin/filmes/${filme.id_filme}/editar`}><button type="button">Editar</button></Link>
                  <button type="button" className="btn-remover" onClick={() => remover(filme.id_filme)}>Remover</button>
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

export default AdminFilmesList;
