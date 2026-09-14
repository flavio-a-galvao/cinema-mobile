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

function AdminSalaForm({ mode }: AdminSalaFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = useMemo(() => mode === "edit", [mode]);
  const [formData, setFormData] = useState<SalaFormData>({ nome: "", capacidade: "40", gerarAssentos: true });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!isEdit || !id) return;

    async function load() {
      try {
        const sala = await api.get<Sala>(`/salas/${id}`);
        setFormData({ nome: String(sala.nome || ""), capacidade: String(sala.capacidade || ""), gerarAssentos: false });
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

    if (!nome || !Number.isFinite(capacidade) || capacidade <= 0) {
      setFeedback("Preencha nome e capacidade validos.");
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
          for (let numero = 1; numero <= capacidade; numero += 1) {
            const fila = String.fromCharCode(65 + Math.floor((numero - 1) / 10));
            await api.post<void>("/assentos", { id_sala: sala.id_sala, numero: String(numero), fila });
          }
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
          <input name="capacidade" type="number" min="1" value={formData.capacidade} onChange={handleChange} />

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
