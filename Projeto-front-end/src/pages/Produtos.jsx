import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./Produtos.css";

const MAX_INGRESSOS = 10;

function Produtos(){
  const navigate = useNavigate();
  const location = useLocation();
  const [filmesApi, setFilmesApi] = useState([]);
  const [sessoesApi, setSessoesApi] = useState([]);
  const [loadingFilmes, setLoadingFilmes] = useState(true);
  const [erroFilmes, setErroFilmes] = useState("");
  const [generoSelecionado, setGeneroSelecionado] = useState("Todos");
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const [sessaoSelecionada, setSessaoSelecionada] = useState("");
  const [assentos, setAssentos] = useState([]);
  const [loadingAssentos, setLoadingAssentos] = useState(false);
  const [erroAssentos, setErroAssentos] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [qtdInteira, setQtdInteira] = useState(0);
  const [qtdMeia, setQtdMeia] = useState(0);
  const [feedback, setFeedback] = useState({ tipo: "", texto: "" });

  const filmePreferidoId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Number(params.get("filme") || 0);
  }, [location.search]);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("cineMaxSession") || "null");
    if (session?.nome) setNome(session.nome);
    if (session?.email) setEmail(session.email);
  }, []);

  useEffect(() => {
    async function loadFilmes() {
      setLoadingFilmes(true);
      setErroFilmes("");

      try {
        const dataFilmes = await api.get("/catalogo/filmes");
        let dataSessoes = [];
        try {
          dataSessoes = await api.get("/catalogo/sessoes");
        } catch {
          dataSessoes = [];
        }

        setSessoesApi(Array.isArray(dataSessoes) ? dataSessoes : []);

        const sessoesPorFilme = new Map();
        for (const sessao of dataSessoes) {
          const idFilme = Number(sessao.id_filme);
          const lista = sessoesPorFilme.get(idFilme) || [];
          const label = sessao.horario
            ? new Date(sessao.horario).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            : "Sessao";
          lista.push(`${label}#${sessao.id_sessao}`);
          sessoesPorFilme.set(idFilme, lista);
        }

        const filmesNormalizados = dataFilmes.map((filme) => ({
          id: filme.id_filme,
          titulo: filme.titulo,
          duracao: filme.duracao ? `${filme.duracao} min` : "--",
          genero: filme.genero || "Sem genero",
          sinopse: filme.sinopse || "Sem sinopse cadastrada.",
          poster: filme.poster_url || "https://i.imgur.com/8w1NikM.jpg",
          classificacao: filme.classificacao_etaria || "Livre",
          sessoes: sessoesPorFilme.get(Number(filme.id_filme)) || [],
        }));

        setFilmesApi(filmesNormalizados);

        if (filmesNormalizados.length > 0) {
          const filmePreferido = filmesNormalizados.find(
            (filme) => Number(filme.id) === Number(filmePreferidoId)
          );
          const filmeInicial = filmePreferido || filmesNormalizados[0];

          setFilmeSelecionado(filmeInicial);
          setSessaoSelecionada(filmeInicial.sessoes[0] || "");
        } else {
          setFilmeSelecionado(null);
          setSessaoSelecionada("");
        }
      } catch (error) {
        setFilmesApi([]);
        setFilmeSelecionado(null);
        setSessaoSelecionada("");
        setErroFilmes(error.message || "Nao foi possivel carregar os filmes do banco.");
      } finally {
        setLoadingFilmes(false);
      }
    }

    loadFilmes();
  }, [filmePreferidoId]);

  const generos = useMemo(() => ["Todos", ...new Set(filmesApi.map((f) => f.genero))], [filmesApi]);

  const filmesFiltrados = useMemo(() => {
    if (generoSelecionado === "Todos") return filmesApi;
    return filmesApi.filter((f) => f.genero === generoSelecionado);
  }, [generoSelecionado, filmesApi]);

  useEffect(() => {
    if (!filmeSelecionado && filmesFiltrados.length > 0) {
      setFilmeSelecionado(filmesFiltrados[0]);
      return;
    }

    if (!filmeSelecionado) return;

    if (!filmesFiltrados.some((filme) => filme.id === filmeSelecionado.id)) {
      setFilmeSelecionado(filmesFiltrados[0] || null);
    }
  }, [filmesFiltrados, filmeSelecionado]);

  useEffect(() => {
    if (!filmeSelecionado) {
      setSessaoSelecionada("");
      return;
    }

    setSessaoSelecionada(filmeSelecionado.sessoes[0] || "");
  }, [filmeSelecionado]);

  const carregarAssentosSessao = useCallback(async (idSessao) => {
    setLoadingAssentos(true);
    setErroAssentos("");

    try {
      const idSessaoNumero = Number(idSessao || 0);

      if (!idSessaoNumero) {
        setAssentos([]);
        return;
      }

      const [assentosApi, ingressosApi, sessoes] = await Promise.all([
        api.get("/catalogo/assentos"),
        api.get("/ingressos"),
        sessoesApi.length > 0 ? Promise.resolve(sessoesApi) : api.get("/catalogo/sessoes"),
      ]);

      const sessaoAlvo = sessoes.find(
        (sessao) => Number(sessao.id_sessao) === idSessaoNumero
      );

      if (!sessaoAlvo?.id_sala) {
        setAssentos([]);
        setErroAssentos("A sessao selecionada nao possui sala vinculada.");
        return;
      }

      const assentosOcupados = new Set(
        ingressosApi
          .filter((ingresso) => Number(ingresso.id_sessao) === idSessaoNumero)
          .map((ingresso) => Number(ingresso.id_assento))
      );

      const assentosSala = assentosApi
        .filter((assento) => Number(assento.id_sala) === Number(sessaoAlvo.id_sala))
        .sort((a, b) => Number(a.numero) - Number(b.numero))
        .map((assento) => ({
          id_assento: Number(assento.id_assento),
          numero: Number(assento.numero),
          ocupado: assentosOcupados.has(Number(assento.id_assento)),
          selecionado: false,
        }));

      setAssentos(assentosSala);
    } catch (error) {
      setAssentos([]);
      setErroAssentos(error.message || "Nao foi possivel carregar assentos da sessao.");
    } finally {
      setLoadingAssentos(false);
    }
  }, [sessoesApi]);

  useEffect(() => {
    const idSessao = Number(String(sessaoSelecionada || "").split("#")[1] || 0);

    if (!idSessao) {
      setAssentos([]);
      setErroAssentos("");
      return;
    }

    carregarAssentosSessao(idSessao);
  }, [sessaoSelecionada, carregarAssentosSessao]);

  const assentosSelecionados = assentos.filter((a) => a.selecionado);
  const assentosOcupadosQtd = assentos.filter((a) => a.ocupado).length;
  const assentosLivresQtd = assentos.length - assentosOcupadosQtd;
  const assentosSelecionadosQtd = assentosSelecionados.length;
  const idSessaoSelecionada = Number(String(sessaoSelecionada || "").split("#")[1] || 0);
  const sessaoAtual = sessoesApi.find((sessao) => Number(sessao.id_sessao) === idSessaoSelecionada);
  const precoInteira = Number(sessaoAtual?.preco || 0);
  const precoMeia = Number((precoInteira / 2).toFixed(2));
  const totalIngressos = qtdInteira + qtdMeia;
  const valorTotal = qtdInteira * precoInteira + qtdMeia * precoMeia;

  useEffect(() => {
    if (assentosSelecionados.length > totalIngressos) {
      let remover = assentosSelecionados.length - totalIngressos;
      setAssentos((old) => old.map((a) => {
        if (remover > 0 && a.selecionado) {
          remover -= 1;
          return { ...a, selecionado: false };
        }
        return a;
      }));
    }
  }, [totalIngressos, assentosSelecionados.length]);

  function alterarQuantidade(tipo, operacao){
    if (tipo === "inteira") {
      if (operacao === "mais" && totalIngressos < MAX_INGRESSOS) {
        setQtdInteira((old) => old + 1);
      }
      if (operacao === "menos" && qtdInteira > 0) {
        setQtdInteira((old) => old - 1);
      }
      return;
    }

    if (operacao === "mais" && totalIngressos < MAX_INGRESSOS) {
      setQtdMeia((old) => old + 1);
    }
    if (operacao === "menos" && qtdMeia > 0) {
      setQtdMeia((old) => old - 1);
    }
  }

  function toggleAssento(idAssento){
    if (totalIngressos <= 0) {
      setFeedback({
        tipo: "erro",
        texto: "Escolha primeiro a quantidade e o tipo de ingresso para selecionar assentos.",
      });
      return;
    }

    if (assentosSelecionados.length >= totalIngressos && !assentos.find((a) => a.id_assento === idAssento)?.selecionado) {
      setFeedback({
        tipo: "erro",
        texto: "Você já selecionou todos os assentos para a quantidade de ingressos escolhida."
      });
      return;
    }

    setAssentos((old) => old.map((a) => a.id_assento === idAssento && !a.ocupado ? { ...a, selecionado: !a.selecionado } : a));
    setFeedback({ tipo: "", texto: "" });
  }

  async function garantirCliente() {
    const session = JSON.parse(localStorage.getItem("cineMaxSession") || "null");
    const nomeCompra = String(session?.nome || nome).trim();

    const cliente = await api.post("/clientes/me", {
      nome: nomeCompra,
      telefone: "",
      data_nascimento: null,
    });

    return cliente.id_cliente;
  }

  async function obterSessaoId() {
    if (!filmeSelecionado) return null;

    const sessoes = sessoesApi.length > 0 ? sessoesApi : await api.get("/sessoes");
    const sessoesDoFilme = sessoes.filter(
      (sessao) => Number(sessao.id_filme) === Number(filmeSelecionado.id)
    );

    if (sessoesDoFilme.length === 0) return null;

    const partes = String(sessaoSelecionada || "").split("#");
    const idDaTag = Number(partes[1] || 0);

    if (idDaTag) {
      const sessaoValida = sessoesDoFilme.find(
        (sessao) => Number(sessao.id_sessao) === idDaTag
      );
      if (sessaoValida) return idDaTag;
    }

    return Number(sessoesDoFilme[0].id_sessao);
  }

  async function reservar(e){
    e.preventDefault();

    const session = JSON.parse(localStorage.getItem("cineMaxSession") || "null");
    if (!session?.email) {
      setFeedback({
        tipo: "erro",
        texto: "Voce precisa estar logado para finalizar a compra. Redirecionando para login...",
      });
      setTimeout(() => navigate("/login?redirect=/produtos&motivo=compra"), 900);
      return;
    }

    const nomeCompra = String(session.nome || nome).trim();
    const emailCompra = String(session.email || email).trim();

    if (nomeCompra !== nome) setNome(nomeCompra);
    if (emailCompra !== email) setEmail(emailCompra);

    if(!nomeCompra || !emailCompra){
      setFeedback({ tipo: "erro", texto: "Preencha nome e email para continuar." });
      return;
    }

    if (!filmeSelecionado) {
      setFeedback({ tipo: "erro", texto: "Nao ha filme disponivel para compra no banco." });
      return;
    }

    if (totalIngressos <= 0) {
      setFeedback({ tipo: "erro", texto: "Escolha pelo menos 1 ingresso (inteira ou meia)." });
      return;
    }

    if (assentosSelecionados.length !== totalIngressos) {
      setFeedback({
        tipo: "erro",
        texto: `Selecione exatamente ${totalIngressos} assento(s) para finalizar a compra.`
      });
      return;
    }

    try {
      const idCliente = await garantirCliente();
      localStorage.setItem("cineMaxLastClienteId", String(idCliente));

      const idSessao = await obterSessaoId();

      if (!idSessao) {
        setFeedback({ tipo: "erro", texto: "Este filme nao possui sessao cadastrada na API." });
        return;
      }

      const ingressosAtuais = await api.get("/ingressos");
      const assentosOcupadosAgora = new Set(
        ingressosAtuais
          .filter((ingresso) => Number(ingresso.id_sessao) === Number(idSessao))
          .map((ingresso) => Number(ingresso.id_assento))
      );

      const assentoConflitante = assentosSelecionados.find((assento) =>
        assentosOcupadosAgora.has(Number(assento.id_assento))
      );

      if (assentoConflitante) {
        setFeedback({
          tipo: "erro",
          texto: `O assento ${assentoConflitante.numero} acabou de ser reservado nesta sessao. Escolha outro assento.`,
        });
        await carregarAssentosSessao(idSessao);
        return;
      }

      const ingressosCriados = [];

      for (const assentoSelecionado of assentosSelecionados) {
        const idAssento = Number(assentoSelecionado.id_assento || 0);
        if (!idAssento) {
          setFeedback({
            tipo: "erro",
            texto: `Assento ${assentoSelecionado.numero} invalido para a sessao selecionada.`,
          });
          return;
        }

        const ingresso = await api.post("/ingressos", {
          id_sessao: idSessao,
          id_cliente: idCliente,
          id_assento: idAssento,
          data_compra: new Date().toISOString(),
        });

        const idIngresso = Number(
          ingresso?.id_ingresso ||
          ingresso?.id ||
          ingresso?.dataValues?.id_ingresso ||
          0
        );
        if (!idIngresso) {
          throw new Error("Nao foi possivel obter o ingresso criado para registrar o pagamento.");
        }

        ingressosCriados.push(idIngresso);
      }

      navigate("/pagamento", {
        state: {
          ingressosIds: ingressosCriados,
          valorTotal,
          totalIngressos,
          filmeTitulo: filmeSelecionado.titulo,
          sessaoLabel: String(sessaoSelecionada || "").split("#")[0],
        },
      });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Erro ao registrar compra na API." });
    }
  }

  return(
    <main className="cinema-page">
      <section className="filtro-catalogo">
        <div className="intro-cinema">
          <h1>Cartaz CINE MAX</h1>
          <p>Escolha o filme, sessão e reserve seu assento.</p>
        </div>
        <div className="filtro">
          <label htmlFor="filtro-genero">Gênero:</label>
          <select
            id="filtro-genero"
            value={generoSelecionado}
            onChange={(e) => setGeneroSelecionado(e.target.value)}
          >
            {generos.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </section>

      {loadingFilmes && <p className="estado-carregando">Carregando filmes...</p>}
      {!loadingFilmes && erroFilmes && <p className="feedback erro">{erroFilmes}</p>}

      {!loadingFilmes && !erroFilmes && (
        <section className="lista-filmes">
          {filmesFiltrados.map((filme) => {
            const ativo = filmeSelecionado?.id === filme.id;
            return (
              <div
                key={filme.id}
                className={`filme-card ${ativo ? "ativo" : ""}`}
                onClick={() => setFilmeSelecionado(filme)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setFilmeSelecionado(filme)}
                aria-pressed={ativo}
              >
                <div className="filme-poster-wrap">
                  <img src={filme.poster} alt={filme.titulo} />
                  <span className="filme-class-badge">{filme.classificacao}</span>
                  {ativo && <span className="filme-ativo-tag">✓ Selecionado</span>}
                </div>
                <div className="filme-info">
                  <h2>{filme.titulo}</h2>
                  <span className="filme-genero">{filme.genero}</span>
                  {filme.duracao !== "--" && (
                    <span className="filme-duracao">⏱ {filme.duracao}</span>
                  )}
                  <span className="filme-sessoes-count">
                    {filme.sessoes.length > 0
                      ? `${filme.sessoes.length} sessão(ões)`
                      : "Sem sessões"}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="detalhes-filme">
        {filmeSelecionado ? (
          <div className="detalhes-grid">
            <div className="detalhes-poster-wrap">
              <img src={filmeSelecionado.poster} alt={filmeSelecionado.titulo} className="detalhes-poster" />
            </div>
            <div className="detalhes-info">
              <h2>{filmeSelecionado.titulo}</h2>
              <div className="detalhes-badges">
                <span className="dbadge dbadge-genero">{filmeSelecionado.genero}</span>
                <span className="dbadge dbadge-class">{filmeSelecionado.classificacao}</span>
                {filmeSelecionado.duracao !== "--" && (
                  <span className="dbadge dbadge-dur">⏱ {filmeSelecionado.duracao}</span>
                )}
              </div>
              <p className="detalhes-sinopse">{filmeSelecionado.sinopse}</p>
              <div className="sessoes">
                <p className="sessoes-label">Escolha a sessão:</p>
                <div className="sessoes-opcoes">
                  {filmeSelecionado.sessoes.length > 0 ? filmeSelecionado.sessoes.map((sessao) => (
                    <button
                      key={sessao}
                      type="button"
                      className={sessaoSelecionada === sessao ? "sessao-ativa" : ""}
                      onClick={() => setSessaoSelecionada(sessao)}
                    >
                      {String(sessao).split("#")[0]}
                    </button>
                  )) : <span className="sem-sessoes">Nenhuma sessão disponível</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="estado-carregando">Nenhum filme selecionado.</p>
        )}
      </section>

      <section className="config-ingressos-area">
        <div className="config-ingressos-head">
          <h3>1. Escolha tipo e quantidade</h3>
          <div className="config-total-pill">
            Total parcial: <strong>R$ {valorTotal.toFixed(2)}</strong>
          </div>
        </div>

        <div className="linha-ingressos">
          <div className={`tipo-ingresso-card ${qtdInteira > 0 ? "ativo" : ""}`}>
            <span className="tipo-badge">Inteira</span>
            <label>Inteira</label>
            <p>R$ {precoInteira.toFixed(2)}</p>
            <div className="controle-qtd">
              <button type="button" className="btn-qtd" onClick={()=>alterarQuantidade("inteira", "menos")}>-</button>
              <span className="qtd-pill">{qtdInteira}</span>
              <button type="button" className="btn-qtd" onClick={()=>alterarQuantidade("inteira", "mais")}>+</button>
            </div>
          </div>

          <div className={`tipo-ingresso-card ${qtdMeia > 0 ? "ativo" : ""}`}>
            <span className="tipo-badge meia">Meia</span>
            <label>Meia Entrada</label>
            <p>R$ {precoMeia.toFixed(2)}</p>
            <div className="controle-qtd">
              <button type="button" className="btn-qtd" onClick={()=>alterarQuantidade("meia", "menos")}>-</button>
              <span className="qtd-pill">{qtdMeia}</span>
              <button type="button" className="btn-qtd" onClick={()=>alterarQuantidade("meia", "mais")}>+</button>
            </div>
          </div>
        </div>

        <p className="resumo-ingressos">
          Limite por compra: {MAX_INGRESSOS} ingressos. Selecionados: {totalIngressos} ingresso(s)
          {qtdInteira > 0 ? ` | Inteira: ${qtdInteira}` : ""}
          {qtdMeia > 0 ? ` | Meia: ${qtdMeia}` : ""}
        </p>
      </section>

      <section className="assentos-area">
        <h3>2. Escolha os assentos</h3>
        <div className="tela-cinema" aria-hidden="true">TELA</div>
        {loadingAssentos && <p>Carregando assentos da sessao...</p>}
        {!loadingAssentos && erroAssentos && <p className="feedback erro">{erroAssentos}</p>}
        {!loadingAssentos && !erroAssentos && assentos.length === 0 && <p>Nenhum assento encontrado para esta sessao.</p>}

        {!loadingAssentos && !erroAssentos && assentos.length > 0 && (
          <>
            <div className="assentos-status">
              <span className="status-chip livres">Livres: {assentosLivresQtd}</span>
              <span className="status-chip ocupados">Ocupados: {assentosOcupadosQtd}</span>
              <span className="status-chip selecionados">Selecionados: {assentosSelecionadosQtd}</span>
            </div>

            <div className="assentos-grid">
              {assentos.map((assento)=> (
                <button key={assento.id_assento}
                  disabled={assento.ocupado}
                  className={assento.ocupado ? 'ocupado' : assento.selecionado ? 'selecionado' : ''}
                  onClick={()=>toggleAssento(assento.id_assento)}>
                  {assento.numero}
                </button>
              ))}
            </div>
          </>
        )}
        <p>Assentos ocupados em vermelho, livres em cinza, selecionados em verde.</p>
      </section>

      <section className="reserva-form">
        <h3>3. Finalizar reserva</h3>
        <form onSubmit={reservar}>
          <label>Nome completo</label>
          <input value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Ex: Ana Maria" />

          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@exemplo.com" />

          <label>Filme selecionado</label>
          <input value={filmeSelecionado?.titulo || "Nenhum filme"} disabled />

          <label>Sessão selecionada</label>
          <input value={String(sessaoSelecionada || "Nenhuma sessao").split("#")[0]} disabled />

          <label>Assentos selecionados</label>
          <input value={assentosSelecionados.map((a)=>a.numero).join(', ') || 'Nenhum'} disabled />

          <label>Total da compra</label>
          <input value={`R$ ${valorTotal.toFixed(2)} (${totalIngressos} ingresso(s))`} disabled />

          <button type="submit" className="btn-finalizar">Ir para pagamento</button>
        </form>
        {feedback.texto && <p className={`feedback ${feedback.tipo}`}>{feedback.texto}</p>}
      </section>
    </main>
  );
}

export default Produtos;
