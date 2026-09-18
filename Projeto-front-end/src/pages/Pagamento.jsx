import { useEffect, useMemo, useState } from "react";
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
  const [purchases, setPurchases] = useState([]);
  const [ready, setReady] = useState(false);
  const ids = useMemo(() => Array.isArray(location.state?.ingressosIds) ? location.state.ingressosIds.map(Number) : [], [location.state]);
  useEffect(() => {
    let active = true;
    api.get('/me/compras').then(items => {
      const own = items.filter(item => ids.includes(item.id));
      if (own.length !== ids.length) throw new Error('Confira seus ingressos em Minhas Compras.');
      if (active) { setPurchases(own); setReady(true); }
    }).catch(error => { if (active) setFeedback({ tipo: 'erro', texto: error.message }); });
    return () => { active = false; };
  }, [ids]);
  const valorTotal = purchases.reduce((sum, item) => sum + Number(item.valor_unitario ?? item.valor), 0);
  const totalIngressos = Number(dados.totalIngressos || 0);
  const filmeTitulo = dados.filmeTitulo || "Filme";
  const sessaoLabel = dados.sessaoLabel || "Sessao";



  async function confirmarPagamento() {
    if (!ready || loading || ingressosIds.length === 0) {
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
      const own = await api.get('/me/compras');
      for (const idIngresso of ingressosIds) {
        const ticket = own.find(item => item.id === Number(idIngresso));
        if (!ticket || ticket.status === 'cancelado') throw new Error('Ingresso indisponível.');
        if (ticket.pago) continue;
        if (!ticket.podePagar) throw new Error('Ingresso antigo sem preço registrado. Consulte Minhas Compras.');
        await api.post("/pagamentos", {
          id_ingresso: Number(idIngresso),
          metodo_pagamento: metodoPagamento,
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

            <button type="button" className="btn-pagar" onClick={confirmarPagamento} disabled={loading || !ready}>
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
