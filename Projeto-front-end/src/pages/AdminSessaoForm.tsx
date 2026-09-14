import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNav from "../componentes/common/AdminNav";
import { api } from "../services/api";
import type { AdminFormMode, Filme, ListPayload, PagedResponse, Sala, Sessao } from "../types";
import "./AdminFilmes.css";

interface SessaoFormData {
  id_filme: string;
  id_sala: string;
  horario: string;
  preco: string;
}

interface AdminSessaoFormProps {
  mode: AdminFormMode;
}

function parseListPayload<T>(payload: ListPayload<T>): T[] {
  const asPaged = payload as PagedResponse<T>;
  if (Array.isArray(asPaged?.data)) return asPaged.data;
  return Array.isArray(payload) ? payload : [];
}

function AdminSessaoForm({ mode }: AdminSessaoFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = useMemo(() => mode === "edit", [mode]);

  const [formData, setFormData] = useState<SessaoFormData>({ id_filme: "", id_sala: "", horario: "", preco: "" });
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [filmesData, salasData] = await Promise.all([
          api.get<ListPayload<Filme>>("/filmes"),
          api.get<ListPayload<Sala>>("/salas"),
        ]);

        const filmesLista = parseListPayload(filmesData);
        const salasLista = parseListPayload(salasData);

        setFilmes(filmesLista);
        setSalas(salasLista);
        setFormData((old) => ({
          ...old,
          id_filme: old.id_filme || String(filmesLista[0]?.id_filme || ""),
          id_sala: old.id_sala || String(salasLista[0]?.id_sala || ""),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nao foi possivel carregar catalogos.";
        setFeedback(message);
      }
    }

    loadCatalogs();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    async function loadSessao() {
      try {
        const sessao = await api.get<Sessao>(`/sessoes/${id}`);
        setFormData({
          id_filme: String(sessao.id_filme || ""),
          id_sala: String(sessao.id_sala || ""),
          horario: sessao.horario ? new Date(sessao.horario).toISOString().slice(0, 16) : "",
          preco: String(sessao.preco || ""),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nao foi possivel carregar sessao.";
        setFeedback(message);
      }
    }

    loadSessao();
  }, [id, isEdit]);

  function handleChange(event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((old) => ({ ...old, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const idFilme = Number(formData.id_filme || 0);
    const idSala = Number(formData.id_sala || 0);
    const preco = Number(formData.preco || 0);

    if (!idFilme || !idSala || !formData.horario || !Number.isFinite(preco) || preco <= 0) {
      setFeedback("Preencha filme, sala, horario e preco validos.");
      return;
    }

    const payload = {
      id_filme: idFilme,
      id_sala: idSala,
      horario: new Date(formData.horario).toISOString(),
      preco,
    };

    setSaving(true);
    setFeedback("");

    try {
      if (isEdit && id) {
        await api.put<Sessao>(`/sessoes/${id}`, payload);
      } else {
        await api.post<Sessao>("/sessoes", payload);
      }
      navigate("/admin/sessoes");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar sessao.";
      setFeedback(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>{isEdit ? "Editar Sessao" : "Nova Sessao"}</h2>
        <AdminNav />

        <form className="admin-filme-form" onSubmit={handleSubmit}>
          <label>Filme</label>
          <select name="id_filme" value={formData.id_filme} onChange={handleChange}>
            <option value="">Selecione</option>
            {filmes.map((filme) => (
              <option key={filme.id_filme} value={filme.id_filme}>{filme.titulo}</option>
            ))}
          </select>

          <label>Sala</label>
          <select name="id_sala" value={formData.id_sala} onChange={handleChange}>
            <option value="">Selecione</option>
            {salas.map((sala) => (
              <option key={sala.id_sala} value={sala.id_sala}>{sala.nome} ({sala.capacidade} lugares)</option>
            ))}
          </select>

          <label>Data e horario</label>
          <input name="horario" type="datetime-local" value={formData.horario} onChange={handleChange} />

          <label>Preco</label>
          <input name="preco" type="number" step="0.01" min="0.01" value={formData.preco} onChange={handleChange} />

          <div className="admin-acoes-form">
            <button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            <button type="button" className="btn-secundario" onClick={() => navigate("/admin/sessoes")}>Cancelar</button>
          </div>
        </form>

        {feedback && <p className="feedback erro">{feedback}</p>}
      </section>
    </main>
  );
}

export default AdminSessaoForm;
