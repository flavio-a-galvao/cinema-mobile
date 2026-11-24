import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../services/api";
import "./MinhasCompras.css";

const QR_SIZE = 21;

function createHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function isFinderArea(row, col) {
  const topLeft = row < 7 && col < 7;
  const topRight = row < 7 && col >= QR_SIZE - 7;
  const bottomLeft = row >= QR_SIZE - 7 && col < 7;
  return topLeft || topRight || bottomLeft;
}

function buildFakeQr(seedText) {
  const seed = createHash(seedText);
  const cells = [];

  for (let row = 0; row < QR_SIZE; row += 1) {
    for (let col = 0; col < QR_SIZE; col += 1) {
      let dark = false;

      if (isFinderArea(row, col)) {
        const localRow = row < 7 ? row : row - (QR_SIZE - 7);
        const localCol = col < 7 ? col : col - (QR_SIZE - 7);
        const border = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
        const center = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
        dark = border || center;
      } else {
        const value = (row * 73 + col * 97 + seed) ^ (seed >>> ((row + col) % 8));
        dark = (value & 1) === 1;
      }

      cells.push(dark);
    }
  }

  return cells;
}

function MinhasCompras() {
  const sessaoAtiva = JSON.parse(localStorage.getItem("cineMaxSession") || "null");
  const isLoggedIn = Boolean(sessaoAtiva?.email);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [cancelando, setCancelando] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const cancelamentoEmAndamento = useRef(false);

  const totalPago = useMemo(
    () => compras.reduce((acc, compra) => acc + (compra.pago ? Number(compra.valor || 0) : 0), 0),
    [compras]
  );

  useEffect(() => {
    async function carregarCompras() {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErro("");

      try {
        const historico = await api.get("/me/compras");
        setCompras(Array.isArray(historico) ? historico : []);
      } catch (error) {
        setErro(error.message || "Nao foi possivel carregar suas compras.");
      } finally {
        setLoading(false);
      }
    }

    carregarCompras();
  }, [isLoggedIn]);

  async function cancelarIngresso(compra) {
    if (cancelamentoEmAndamento.current || compra.status === "cancelado" || compra.podeCancelar !== true) return;
    if (!window.confirm(`Cancelar o ingresso do assento ${compra.assento}?`)) return;

    cancelamentoEmAndamento.current = true;
    setCancelando(compra.id);
    setFeedback(null);
    let confirmado = false;
    try {
      const cancelado = await api.patch(`/ingressos/${compra.id}/cancelar`);
      confirmado = true;
      setCompras((itens) => itens.map((item) => item.id === compra.id
        ? { ...item, status: cancelado.status, podePagar: false, podeCancelar: false }
        : item));
      setFeedback({ tipo: "sucesso", texto: "Ingresso cancelado." });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Não foi possível cancelar o ingresso." });
    }

    try {
      const historico = await api.get("/me/compras");
      setCompras(historico);
    } catch {
      if (confirmado) setFeedback({ tipo: "sucesso", texto: "Ingresso cancelado. Recarregue a página para atualizar o histórico completo." });
    } finally {
      cancelamentoEmAndamento.current = false;
      setCancelando(null);
    }
  }

  if (!isLoggedIn) {
    return <Navigate to="/login?redirect=/minhas-compras" replace />;
  }

  return (
    <main className="compras-page">
      <section className="compras-card">
        <h2>Minhas Compras</h2>
        <p className="compras-subtitle">Historico de ingressos e pagamentos realizados na plataforma.</p>

        {loading && <p>Carregando compras...</p>}
        {!loading && erro && <p className="compras-erro">{erro}</p>}
        {feedback && <p className={feedback.tipo === "erro" ? "compras-erro" : undefined} role={feedback.tipo === "erro" ? "alert" : "status"}>{feedback.texto}</p>}
        {!loading && !erro && compras.length === 0 && (
          <p>Voce ainda nao possui compras registradas.</p>
        )}

        {!loading && !erro && compras.length > 0 && (
          <>
            <div className="compras-resumo">
              <strong>Total de compras:</strong> {compras.length}
              <span>
                <strong>Valor total:</strong> R$ {totalPago.toFixed(2)}
              </span>
            </div>

            <div className="compras-lista">
              {compras.map((compra) => (
                <article key={compra.id} className="compra-item">
                  <div>
                    <h3>{compra.filme}</h3>
                    <p><strong>Ingresso:</strong> #{compra.id}</p>
                    <p><strong>Sessao:</strong> {compra.horario ? new Date(compra.horario).toLocaleString('pt-BR') : 'Horário indisponível'}</p>
                    <p><strong>Assento:</strong> {compra.assento}</p>
                    <p><strong>Status:</strong> {compra.status === "cancelado" ? "Cancelado" : compra.pago ? "Pago" : compra.podePagar ? "Pagamento pendente" : "Pagamento indisponível"}</p>
                    <p><strong>Metodo:</strong> {compra.metodo}</p>
                    <p><strong>Valor:</strong> R$ {Number(compra.valor).toFixed(2)}</p>
                    <p><strong>Compra:</strong> {compra.dataCompra ? new Date(compra.dataCompra).toLocaleString('pt-BR') : 'Data indisponível'}</p>
                    <div className="compra-acoes">
                      {compra.podePagar === true && !compra.pago && compra.status !== "cancelado" && cancelando !== compra.id && (
                        <Link to={`/pagamento?ingressos=${compra.id}`}>Continuar pagamento</Link>
                      )}
                      {compra.podeCancelar === true && compra.status !== "cancelado" && (
                        <button type="button" onClick={() => cancelarIngresso(compra)} disabled={cancelando !== null}>
                          {cancelando === compra.id ? "Cancelando..." : "Cancelar ingresso"}
                        </button>
                      )}
                    </div>
                  </div>
                  {compra.status !== "cancelado" && <div className="compra-qr" aria-label={`QR code do ingresso ${compra.id}`}>
                    {buildFakeQr(`${compra.id}|${compra.filme}|${compra.assento}|${compra.sessao}`).map((dark, index) => (
                      <span key={`${compra.id}-${index}`} className={dark ? "qr-cell qr-cell-dark" : "qr-cell"} />
                    ))}
                  </div>}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default MinhasCompras;
