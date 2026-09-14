import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNav from "../componentes/common/AdminNav";
import { api } from "../services/api";
import type { AdminFormMode, Filme } from "../types";
import "./AdminFilmes.css";

interface FilmeFormData {
  titulo: string;
  genero: string;
  classificacao_etaria: string;
  duracao: string;
  sinopse: string;
  poster_url: string;
  data_lancamento: string;
}

interface AdminFilmeFormProps {
  mode: AdminFormMode;
}

const initialForm: FilmeFormData = {
  titulo: "",
  genero: "",
  classificacao_etaria: "",
  duracao: "",
  sinopse: "",
  poster_url: "",
  data_lancamento: "",
};

function AdminFilmeForm({ mode }: AdminFilmeFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<FilmeFormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isEdit = useMemo(() => mode === "edit", [mode]);

  useEffect(() => {
    if (!isEdit || !id) return;

    async function load() {
      try {
        const filme = await api.get<Filme>(`/filmes/${id}`);
        setFormData({
          titulo: filme.titulo || "",
          genero: filme.genero || "",
          classificacao_etaria: filme.classificacao_etaria || "",
          duracao: String(filme.duracao || ""),
          sinopse: filme.sinopse || "",
          poster_url: filme.poster_url || "",
          data_lancamento: filme.data_lancamento ? new Date(filme.data_lancamento).toISOString().slice(0, 10) : "",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nao foi possivel carregar o filme.";
        setFeedback(message);
      }
    }

    load();
  }, [id, isEdit]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormData((old) => ({ ...old, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.titulo.trim() || !formData.genero.trim() || Number(formData.duracao || 0) <= 0) {
      setFeedback("Preencha titulo, genero e duracao validos.");
      return;
    }

    const payload = {
      ...formData,
      titulo: formData.titulo.trim(),
      genero: formData.genero.trim(),
      duracao: Number(formData.duracao),
      data_lancamento: formData.data_lancamento ? new Date(formData.data_lancamento).toISOString() : null,
    };

    setSaving(true);
    setFeedback("");

    try {
      if (isEdit && id) {
        await api.put<Filme>(`/filmes/${id}`, payload);
      } else {
        await api.post<Filme>("/filmes", payload);
      }
      navigate("/admin/filmes");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar o filme.";
      setFeedback(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>{isEdit ? "Editar Filme" : "Novo Filme"}</h2>
        <AdminNav />

        <form className="admin-filme-form" onSubmit={handleSubmit}>
          <label>Titulo</label>
          <input name="titulo" value={formData.titulo} onChange={handleChange} />

          <label>Genero</label>
          <input name="genero" value={formData.genero} onChange={handleChange} />

          <label>Classificacao</label>
          <input name="classificacao_etaria" value={formData.classificacao_etaria} onChange={handleChange} />

          <label>Duracao (min)</label>
          <input name="duracao" type="number" min="1" value={formData.duracao} onChange={handleChange} />

          <label>Data de lancamento</label>
          <input name="data_lancamento" type="date" value={formData.data_lancamento} onChange={handleChange} />

          <label>Poster URL</label>
          <input name="poster_url" value={formData.poster_url} onChange={handleChange} />

          <label>Sinopse</label>
          <textarea name="sinopse" rows={4} value={formData.sinopse} onChange={handleChange} />

          <div className="admin-acoes-form">
            <button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            <button type="button" className="btn-secundario" onClick={() => navigate("/admin/filmes")}>Cancelar</button>
          </div>
        </form>

        {feedback && <p className="feedback erro">{feedback}</p>}
      </section>
    </main>
  );
}

export default AdminFilmeForm;
