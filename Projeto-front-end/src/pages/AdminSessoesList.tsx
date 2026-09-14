import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminPagination from "../componentes/common/AdminPagination";
import AdminNav from "../componentes/common/AdminNav";
import { api } from "../services/api";
import type { Filme, ListPayload, PaginationMeta, PagedResponse, Sala, Sessao } from "../types";
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

function AdminSessoesList() {
  const navigate = useNavigate();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const filmesMap = useMemo(() => new Map(filmes.map((f) => [Number(f.id_filme), f])), [filmes]);
  const salasMap = useMemo(() => new Map(salas.map((s) => [Number(s.id_sala), s])), [salas]);

  async function load(page = 1) {
    setLoading(true);
    try {
      const [payload, filmesData, salasData] = await Promise.all([
        api.get<ListPayload<Sessao>>(`/sessoes?page=${page}&limit=${PAGE_LIMIT}`),
        api.get<ListPayload<Filme>>("/filmes"),
        api.get<ListPayload<Sala>>("/salas"),
      ]);

      const normalizedSessoes = parseListPayload(payload, page);
      const normalizedFilmes = parseListPayload(filmesData, 1);
      const normalizedSalas = parseListPayload(salasData, 1);

      setSessoes(normalizedSessoes.data);
      setFilmes(normalizedFilmes.data);
      setSalas(normalizedSalas.data);
      setMeta(normalizedSessoes.meta);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel carregar sessoes.";
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remover(id: number) {
    if (!window.confirm("Tem certeza que deseja remover esta sessao?")) return;
    try {
      await api.delete<void>(`/sessoes/${id}`);
      setFeedback("Sessao removida com sucesso.");
      await load(meta.page);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel remover a sessao.";
      setFeedback(message);
    }
  }

  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>Sessoes</h2>
        <AdminNav />

        <div className="admin-acoes-form">
          <button type="button" onClick={() => navigate("/admin/sessoes/nova")}>Cadastrar nova sessao</button>
        </div>

        {feedback && <p className="feedback sucesso">{feedback}</p>}
        {loading && <p>Carregando sessoes...</p>}

        {!loading && (
          <div className="admin-simples-grid">
            {sessoes.map((sessao) => (
              <article key={sessao.id_sessao} className="admin-simples-item">
                <h4>{filmesMap.get(Number(sessao.id_filme))?.titulo || `Filme #${sessao.id_filme}`}</h4>
                <p><strong>Sala:</strong> {salasMap.get(Number(sessao.id_sala))?.nome || `Sala #${sessao.id_sala}`}</p>
                <p><strong>Horario:</strong> {sessao.horario ? new Date(sessao.horario).toLocaleString("pt-BR") : "-"}</p>
                <p><strong>Preco:</strong> R$ {Number(sessao.preco || 0).toFixed(2)}</p>
                <div className="admin-filme-botoes">
                  <Link to={`/admin/sessoes/${sessao.id_sessao}/editar`}><button type="button">Editar</button></Link>
                  <button type="button" className="btn-remover" onClick={() => remover(sessao.id_sessao)}>Remover</button>
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

export default AdminSessoesList;
