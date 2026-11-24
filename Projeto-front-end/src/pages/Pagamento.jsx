import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import "./Pagamento.css";

const PAGAMENTO_EXISTENTE = { tipo: "info", texto: "Os ingressos selecionados já estão pagos." };

const OPCOES_PAGAMENTO = [
  { valor: "pix", titulo: "Pix", descricao: "Aprovação imediata" },
  { valor: "cartao", titulo: "Cartão", descricao: "Crédito ou débito" },
  { valor: "dinheiro", titulo: "Dinheiro", descricao: "Pagamento no caixa" },
];

function ingressosPendentes(compras, ids) {
  const selecionados = ids.map((id) => compras.find((compra) => compra.id === id));
  if (selecionados.some((compra) => !compra || compra.status === "cancelado" || (!compra.pago && compra.podePagar !== true))) {
    throw new Error("Um dos ingressos está indisponível para pagamento. Confira Minhas Compras.");
  }
  return selecionados.filter((compra) => !compra.pago);
}

function PagamentoPendente({ referencia }) {
  const navigate = useNavigate();
  const [ids] = useState(() => {
    const valores = referencia.split(",");
    if (valores.length > 10 || !valores.every((valor) => /^[1-9]\d*$/.test(valor) && Number.isSafeInteger(Number(valor)))) return [];
    return [...new Set(valores.map(Number))];
  });
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [pendentes, setPendentes] = useState([]);
  const [carregando, setCarregando] = useState(ids.length > 0);
  const [pagando, setPagando] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: "", texto: "" });
  const enviando = useRef(false);

  useEffect(() => {
    if (!ids.length) return;
    let ativo = true;
    api.get("/me/compras")
      .then((compras) => {
        const ingressos = ingressosPendentes(compras, ids);
        if (ativo) {
          setPendentes(ingressos);
          if (!ingressos.length) setFeedback(PAGAMENTO_EXISTENTE);
        }
      })
      .catch((error) => {
        if (ativo) setFeedback({ tipo: "erro", texto: error.message });
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [ids]);

  useEffect(() => {
    if (feedback.tipo !== "sucesso") return;
    const timer = setTimeout(() => navigate("/minhas-compras", { replace: true }), 1200);
    return () => clearTimeout(timer);
  }, [feedback.tipo, navigate]);

  async function confirmarPagamento() {
    if (enviando.current || !pendentes.length || feedback.tipo === "sucesso") return;
    if (!metodoPagamento) {
      setFeedback({ tipo: "erro", texto: "Selecione a forma de pagamento para continuar." });
      return;
    }

    enviando.current = true;
    setPagando(true);
    setFeedback({ tipo: "", texto: "" });

    try {
      const atuais = ingressosPendentes(await api.get("/me/compras"), ids);
      setPendentes(atuais);
      let pagouNestaAba = false;
      for (const ingresso of atuais) {
        try {
          await api.post("/pagamentos", {
            id_ingresso: ingresso.id,
            metodo_pagamento: metodoPagamento,
          });
          pagouNestaAba = true;
        } catch (error) {
          if (error.status !== 409) throw error;
          const compras = await api.get("/me/compras").catch(() => []);
          const jaPago = compras.some((compra) => compra.id === ingresso.id && compra.pago && compra.status !== "cancelado");
          if (!jaPago) throw error;
        }
        setPendentes((itens) => itens.filter((item) => item.id !== ingresso.id));
      }
      setFeedback(pagouNestaAba
        ? { tipo: "sucesso", texto: "Pagamento confirmado com sucesso. Redirecionando para Minhas Compras..." }
        : PAGAMENTO_EXISTENTE);
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Erro ao confirmar pagamento." });
    } finally {
      setPagando(false);
      enviando.current = false;
    }
  }

  const primeiro = pendentes[0];
  const valorTotal = pendentes.reduce((total, ingresso) => total + Number(ingresso.valor_unitario ?? ingresso.valor), 0);

  return (
    <main className="pagamento-page">
      <section className="pagamento-card">
        <h2>Finalizar Pagamento</h2>
        <p className="pagamento-subtitle">Confirme a forma de pagamento para concluir sua compra.</p>

        {carregando && <p role="status">Carregando ingressos...</p>}
        {!carregando && !primeiro && !["sucesso", "info"].includes(feedback.tipo) && (
          <p>Nenhuma compra pendente encontrada. <Link to="/minhas-compras">Ir para Minhas Compras</Link></p>
        )}

        {primeiro && (
          <>
            <div className="pagamento-resumo">
              <p><strong>Filme:</strong> {primeiro.filme}</p>
              <p><strong>Sessão:</strong> {primeiro.horario ? new Date(primeiro.horario).toLocaleString("pt-BR") : "Horário indisponível"}</p>
              <p><strong>Ingressos:</strong> {pendentes.length}</p>
              <p><strong>Assentos:</strong> {pendentes.map((ingresso) => ingresso.assento).join(", ")}</p>
              <p><strong>Total:</strong> R$ {valorTotal.toFixed(2)}</p>
            </div>

            <div className="pagamento-opcoes" role="radiogroup" aria-label="Forma de pagamento">
              {OPCOES_PAGAMENTO.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  role="radio"
                  aria-checked={metodoPagamento === opcao.valor}
                  className={metodoPagamento === opcao.valor ? "pagamento-opcao ativa" : "pagamento-opcao"}
                  disabled={pagando}
                  onClick={() => setMetodoPagamento(opcao.valor)}
                >
                  <strong>{opcao.titulo}</strong>
                  <small>{opcao.descricao}</small>
                </button>
              ))}
            </div>

            <button type="button" className="btn-pagar" onClick={confirmarPagamento} disabled={pagando}>
              {pagando ? "Processando..." : "Confirmar pagamento"}
            </button>
          </>
        )}

        {feedback.texto && (
          <p className={`feedback ${feedback.tipo}`} role={feedback.tipo === "erro" ? "alert" : "status"}>
            {feedback.texto}
            {feedback.tipo === "info" && <> <Link to="/minhas-compras">Ir para Minhas Compras</Link></>}
          </p>
        )}
      </section>
    </main>
  );
}

export default function Pagamento() {
  const [params] = useSearchParams();
  const referencia = params.get("ingressos") || "";
  return <PagamentoPendente key={referencia} referencia={referencia} />;
}
