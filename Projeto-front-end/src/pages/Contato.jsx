import { useState } from "react";
import "./Contato.css";

function Contato() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: ""
  });
  const [status, setStatus] = useState("");

  function atualizarCampo(evento) {
    const { name, value } = evento.target;
    setFormData((anterior) => ({ ...anterior, [name]: value }));
  }

  function enviarFormulario(evento) {
    evento.preventDefault();

    if (!formData.nome.trim() || !formData.email.trim() || !formData.mensagem.trim()) {
      setStatus("Preencha nome, email e mensagem para enviar.");
      return;
    }

    setStatus("Mensagem enviada com sucesso. Retornaremos em breve.");
    setFormData({ nome: "", email: "", assunto: "", mensagem: "" });
  }

  return (
    <main className="contato-page">
      <section className="contato-hero">
        <h1>Contato - CINE MAX</h1>
        <p>
          Tem duvidas, sugestoes ou quer falar com a equipe? Envie sua mensagem
          e responderemos o mais rapido possivel.
        </p>
      </section>

      <section className="contato-box">
        <form onSubmit={enviarFormulario} className="contato-form">
          <label htmlFor="nome">Nome completo</label>
          <input
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={atualizarCampo}
            placeholder="Ex: Ana Silva"
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={atualizarCampo}
            placeholder="email@exemplo.com"
          />

          <label htmlFor="assunto">Assunto</label>
          <input
            id="assunto"
            name="assunto"
            value={formData.assunto}
            onChange={atualizarCampo}
            placeholder="Ex: Eventos e reservas"
          />

          <label htmlFor="mensagem">Mensagem</label>
          <textarea
            id="mensagem"
            name="mensagem"
            value={formData.mensagem}
            onChange={atualizarCampo}
            placeholder="Digite sua mensagem..."
            rows={5}
          />

          <button type="submit">Enviar mensagem</button>
        </form>

        <aside className="contato-info">
          <h2>Atendimento</h2>
          <p><strong>Email:</strong> contato@cinemax.com</p>
          <p><strong>Telefone:</strong> (11) 4002-8922</p>
          <p><strong>Horario:</strong> Seg a Dom, 10h as 22h</p>
          <p><strong>Endereco:</strong> Shopping Centro, Sao Paulo - SP</p>
        </aside>
      </section>

      {status && <p className="contato-status">{status}</p>}
    </main>
  );
}

export default Contato;
