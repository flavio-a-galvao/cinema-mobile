import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./Pagamento.css";

const OPCOES_PAGAMENTO = [
  { valor: "pix", titulo: "Pix", descricao: "Aprovacao imediata" },
  { valor: "cartao", titulo: "Cartao", descricao: "Credito ou debito" },
  { valor: "dinheiro", titulo: "Dinheiro", descricao: "Pagamento no caixa" },
];

function Pagamento() {
  const navigate = useNavigate();
  const location = useLocation();
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: "", texto: "" });

  const dados = location.state || {};
  const ingressosIds = Array.isArray(dados.ingressosIds) ? dados.ingressosIds : [];
  const valorTotal = Number(dados.valorTotal || 0);
  const totalIngressos = Number(dados.totalIngressos || 0);
  const filmeTitulo = dados.filmeTitulo || "Filme";
  const sessaoLabel = dados.sessaoLabel || "Sessao";

  const valorPorIngresso = useMemo(() => {
    if (!totalIngressos) return 0;
    return Number((valorTotal / totalIngressos).toFixed(2));
  }, [totalIngressos, valorTotal]);

  async function confirmarPagamento() {
    if (ingressosIds.length === 0) {
      setFeedback({ tipo: "erro", texto: "Nenhum ingresso pendente para pagamento." });
      return;
    }

    if (!metodoPagamento) {
      setFeedback({ tipo: "erro", texto: "Selecione a forma de pagamento para continuar." });
      return;
    }

    setLoading(true);
    setFeedback({ tipo: "", texto: "" });

    try {
      for (const idIngresso of ingressosIds) {
        await api.post("/pagamentos", {
          id_ingresso: Number(idIngresso),
          valor: valorPorIngresso,
          metodo_pagamento: metodoPagamento,
          data_pagamento: new Date().toISOString(),
        });
      }

      setFeedback({
        tipo: "sucesso",
        texto: "Pagamento confirmado com sucesso. Redirecionando para Minhas Compras...",
      });

      setTimeout(() => navigate("/minhas-compras"), 1200);
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Erro ao confirmar pagamento." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pagamento-page">
      <section className="pagamento-card">
        <h2>Finalizar Pagamento</h2>
        <p className="pagamento-subtitle">Confirme a forma de pagamento para concluir sua compra.</p>

        {ingressosIds.length === 0 ? (
          <p>
            Nenhuma compra pendente encontrada. <Link to="/produtos">Voltar para Produtos</Link>
          </p>
        ) : (
          <>
            <div className="pagamento-resumo">
              <p><strong>Filme:</strong> {filmeTitulo}</p>
              <p><strong>Sessao:</strong> {sessaoLabel}</p>
              <p><strong>Ingressos:</strong> {totalIngressos}</p>
              <p><strong>Total:</strong> R$ {valorTotal.toFixed(2)}</p>
            </div>

            <label>Forma de pagamento</label>
            <div className="pagamento-opcoes" role="radiogroup" aria-label="Forma de pagamento">
              {OPCOES_PAGAMENTO.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  role="radio"
                  aria-checked={metodoPagamento === opcao.valor}
                  className={`pagamento-opcao ${metodoPagamento === opcao.valor ? "ativa" : ""}`}
                  onClick={() => setMetodoPagamento(opcao.valor)}
                >
                  <strong>{opcao.titulo}</strong>
                  <small>{opcao.descricao}</small>
                </button>
              ))}
            </div>

            <button type="button" className="btn-pagar" onClick={confirmarPagamento} disabled={loading}>
              {loading ? "Processando..." : "Confirmar pagamento"}
            </button>
          </>
        )}

        {feedback.texto && <p className={`feedback ${feedback.tipo}`}>{feedback.texto}</p>}
      </section>
    </main>
  );
}

export default Pagamento;
