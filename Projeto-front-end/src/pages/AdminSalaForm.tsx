import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNav from "../componentes/common/AdminNav";
import { api } from "../services/api";
import type { AdminFormMode, Sala } from "../types";
import "./AdminFilmes.css";

interface SalaFormData {
  nome: string;
  capacidade: string;
  gerarAssentos: boolean;
}

interface AdminSalaFormProps {
  mode: AdminFormMode;
}

const ROOM_CAPACITY = 48;

function AdminSalaForm({ mode }: AdminSalaFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = useMemo(() => mode === "edit", [mode]);
  const [formData, setFormData] = useState<SalaFormData>({ nome: "", capacidade: String(ROOM_CAPACITY), gerarAssentos: true });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!isEdit || !id) return;

    async function load() {
      try {
        const sala = await api.get<Sala>(`/salas/${id}`);
        setFormData({ nome: String(sala.nome || ""), capacidade: String(ROOM_CAPACITY), gerarAssentos: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nao foi possivel carregar sala.";
        setFeedback(message);
      }
    }

    load();
  }, [id, isEdit]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;
    setFormData((old) => ({ ...old, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nome = String(formData.nome || "").trim();
    const capacidade = Number(formData.capacidade || 0);

    if (!nome || capacidade !== ROOM_CAPACITY) {
      setFeedback("Preencha o nome. O mapa padrao possui 48 lugares.");
      return;
    }

    setSaving(true);
    setFeedback("");

    try {
      if (isEdit && id) {
        await api.put<Sala>(`/salas/${id}`, { nome, capacidade });
      } else {
        const sala = await api.post<Sala>("/salas", { nome, capacidade });

        if (formData.gerarAssentos) {
          await api.post(`/salas/${sala.id_sala}/assentos/gerar`, {});
        }
      }

      navigate("/admin/salas");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar a sala.";
      setFeedback(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>{isEdit ? "Editar Sala" : "Nova Sala"}</h2>
        <AdminNav />

        <form className="admin-filme-form" onSubmit={handleSubmit}>
          <label>Nome</label>
          <input name="nome" value={formData.nome} onChange={handleChange} />

          <label>Capacidade</label>
          <input name="capacidade" aria-label="Capacidade" type="number" value={formData.capacidade} readOnly />
          <small>Mapa padrao A1–F8, com 48 lugares.</small>

          {!isEdit && (
            <label className="checkbox-inline">
              <input type="checkbox" name="gerarAssentos" checked={formData.gerarAssentos} onChange={handleChange} />
              Gerar assentos automaticamente
            </label>
          )}

          <div className="admin-acoes-form">
            <button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            <button type="button" className="btn-secundario" onClick={() => navigate("/admin/salas")}>Cancelar</button>
          </div>
        </form>

        {feedback && <p className="feedback erro">{feedback}</p>}
      </section>
    </main>
  );
}

export default AdminSalaForm;
