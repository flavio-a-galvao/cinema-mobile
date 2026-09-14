import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminPagination from "../componentes/common/AdminPagination";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import "./AdminFilmes.css";

const PAGE_LIMIT = 6;

const initialForm = {
  titulo: "",
  genero: "",
  classificacao_etaria: "",
  duracao: "",
  sinopse: "",
  poster_url: "",
  data_lancamento: "",
};

const initialSalaForm = {
  nome: "",
  capacidade: "40",
  gerarAssentos: true,
};

const initialSessaoForm = {
  id_filme: "",
  id_sala: "",
  horario: "",
  preco: "",
};

function AdminFilmes() {
  const { isAdmin } = useAuth();

  const [filmes, setFilmes] = useState([]);
  const [salas, setSalas] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [filmesCatalogo, setFilmesCatalogo] = useState([]);
  const [salasCatalogo, setSalasCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [salaFormData, setSalaFormData] = useState(initialSalaForm);
  const [sessaoFormData, setSessaoFormData] = useState(initialSessaoForm);
  const [salaEditData, setSalaEditData] = useState({ nome: "", capacidade: "" });
  const [sessaoEditData, setSessaoEditData] = useState(initialSessaoForm);
  const [editingId, setEditingId] = useState(null);
  const [editingSalaId, setEditingSalaId] = useState(null);
  const [editingSessaoId, setEditingSessaoId] = useState(null);
  const [feedback, setFeedback] = useState({ tipo: "", texto: "" });
  const [filmesPage, setFilmesPage] = useState(1);
  const [salasPage, setSalasPage] = useState(1);
  const [sessoesPage, setSessoesPage] = useState(1);
  const [filmesMeta, setFilmesMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [salasMeta, setSalasMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [sessoesMeta, setSessoesMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  const tituloFormulario = useMemo(
    () => (editingId ? "Editar filme" : "Cadastrar novo filme"),
    [editingId]
  );

  function parsePagedResponse(payload, fallbackPage) {
    if (Array.isArray(payload)) {
      return {
        items: payload,
        page: fallbackPage,
        total: payload.length,
        totalPages: 1,
      };
    }

    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.rows)
      ? payload.rows
      : [];

    const pagination = payload?.pagination || {};

    const total = Number(payload?.total || payload?.count || pagination?.total || items.length) || items.length;
    const totalPagesFromApi = Number(payload?.totalPages || payload?.pages || pagination?.totalPages || 0);
    const totalPages = Math.max(1, totalPagesFromApi || Math.ceil(total / PAGE_LIMIT));
    const page = Number(payload?.page || pagination?.page || fallbackPage) || fallbackPage;

    return { items, total, totalPages, page };
  }

  async function carregarCatalogos() {
    const [filmesData, salasData] = await Promise.all([api.get("/filmes"), api.get("/salas")]);
    const filmesLista = parsePagedResponse(filmesData, 1).items;
    const salasLista = parsePagedResponse(salasData, 1).items;

    setFilmesCatalogo(filmesLista);
    setSalasCatalogo(salasLista);

    setSessaoFormData((old) => ({
      ...old,
      id_filme: old.id_filme || String(filmesLista[0]?.id_filme || ""),
      id_sala: old.id_sala || String(salasLista[0]?.id_sala || ""),
    }));
  }

  async function carregarFilmes(pageAtual = filmesPage) {
    const payload = await api.get(`/filmes?page=${pageAtual}&limit=${PAGE_LIMIT}`);
    const parsed = parsePagedResponse(payload, pageAtual);
    setFilmes(parsed.items);
    setFilmesMeta({ page: parsed.page, totalPages: parsed.totalPages, total: parsed.total });
    setFilmesPage(parsed.page);
  }

  async function carregarSalas(pageAtual = salasPage) {
    const payload = await api.get(`/salas?page=${pageAtual}&limit=${PAGE_LIMIT}`);
    const parsed = parsePagedResponse(payload, pageAtual);
    setSalas(parsed.items);
    setSalasMeta({ page: parsed.page, totalPages: parsed.totalPages, total: parsed.total });
    setSalasPage(parsed.page);
  }

  async function carregarSessoes(pageAtual = sessoesPage) {
    const payload = await api.get(`/sessoes?page=${pageAtual}&limit=${PAGE_LIMIT}`);
    const parsed = parsePagedResponse(payload, pageAtual);
    setSessoes(parsed.items);
    setSessoesMeta({ page: parsed.page, totalPages: parsed.totalPages, total: parsed.total });
    setSessoesPage(parsed.page);
  }

  async function carregarPainel(pageOverrides = {}) {
    setLoading(true);

    try {
      await Promise.all([
        carregarFilmes(pageOverrides.filmesPage || filmesPage),
        carregarSalas(pageOverrides.salasPage || salasPage),
        carregarSessoes(pageOverrides.sessoesPage || sessoesPage),
        carregarCatalogos(),
      ]);
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel carregar os dados administrativos." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    carregarPainel({ filmesPage: 1, salasPage: 1, sessoesPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((old) => ({ ...old, [name]: value }));
  }

  function handleSalaChange(event) {
    const { name, value, type, checked } = event.target;
    setSalaFormData((old) => ({ ...old, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSessaoChange(event) {
    const { name, value } = event.target;
    setSessaoFormData((old) => ({ ...old, [name]: value }));
  }

  function limparFormulario() {
    setFormData(initialForm);
    setEditingId(null);
  }

  function limparEdicaoSala() {
    setEditingSalaId(null);
    setSalaEditData({ nome: "", capacidade: "" });
  }

  function limparEdicaoSessao() {
    setEditingSessaoId(null);
    setSessaoEditData(initialSessaoForm);
  }

  function validar() {
    if (!formData.titulo.trim()) return "Informe o titulo do filme.";
    if (!formData.genero.trim()) return "Informe o genero.";
    if (!String(formData.duracao).trim()) return "Informe a duracao em minutos.";

    const duracaoNumero = Number(formData.duracao);
    if (!Number.isFinite(duracaoNumero) || duracaoNumero <= 0) {
      return "A duracao deve ser um numero maior que zero.";
    }

    return "";
  }

  async function salvarFilme(event) {
    event.preventDefault();
    const erroValidacao = validar();

    if (erroValidacao) {
      setFeedback({ tipo: "erro", texto: erroValidacao });
      return;
    }

    const payload = {
      titulo: formData.titulo.trim(),
      genero: formData.genero.trim(),
      classificacao_etaria: formData.classificacao_etaria.trim(),
      duracao: Number(formData.duracao),
      sinopse: formData.sinopse.trim(),
      poster_url: formData.poster_url.trim(),
      data_lancamento: formData.data_lancamento ? new Date(formData.data_lancamento).toISOString() : null,
    };

    setSalvando(true);
    setFeedback({ tipo: "", texto: "" });

    try {
      if (editingId) {
        await api.put(`/filmes/${editingId}`, payload);
        setFeedback({ tipo: "sucesso", texto: "Filme atualizado com sucesso." });
      } else {
        await api.post("/filmes", payload);
        setFeedback({ tipo: "sucesso", texto: "Filme cadastrado com sucesso." });
      }

      limparFormulario();
      await carregarPainel();
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel salvar o filme." });
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSala(event) {
    event.preventDefault();

    const nome = String(salaFormData.nome || "").trim();
    const capacidade = Number(salaFormData.capacidade || 0);

    if (!nome) {
      setFeedback({ tipo: "erro", texto: "Informe o nome da sala." });
      return;
    }

    if (!Number.isFinite(capacidade) || capacidade <= 0) {
      setFeedback({ tipo: "erro", texto: "A capacidade da sala deve ser maior que zero." });
      return;
    }

    setSalvando(true);
    setFeedback({ tipo: "", texto: "" });

    try {
      const sala = await api.post("/salas", { nome, capacidade });

      if (salaFormData.gerarAssentos) {
        for (let numero = 1; numero <= capacidade; numero += 1) {
          const fila = String.fromCharCode(65 + Math.floor((numero - 1) / 10));
          await api.post("/assentos", {
            id_sala: sala.id_sala,
            numero: String(numero),
            fila,
          });
        }
      }

      setSalaFormData(initialSalaForm);
      setFeedback({
        tipo: "sucesso",
        texto: salaFormData.gerarAssentos
          ? "Sala cadastrada e assentos gerados com sucesso."
          : "Sala cadastrada com sucesso.",
      });
      await carregarPainel({ salasPage: 1 });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel cadastrar a sala." });
    } finally {
      setSalvando(false);
    }
  }

  async function salvarSessao(event) {
    event.preventDefault();

    const idFilme = Number(sessaoFormData.id_filme || 0);
    const idSala = Number(sessaoFormData.id_sala || 0);
    const preco = Number(sessaoFormData.preco || 0);
    const horario = String(sessaoFormData.horario || "").trim();

    if (!idFilme) {
      setFeedback({ tipo: "erro", texto: "Selecione um filme para a sessao." });
      return;
    }

    if (!idSala) {
      setFeedback({ tipo: "erro", texto: "Selecione uma sala para a sessao." });
      return;
    }

    if (!horario) {
      setFeedback({ tipo: "erro", texto: "Informe data e horario da sessao." });
      return;
    }

    if (!Number.isFinite(preco) || preco <= 0) {
      setFeedback({ tipo: "erro", texto: "Informe um preco valido para a sessao." });
      return;
    }

    setSalvando(true);
    setFeedback({ tipo: "", texto: "" });

    try {
      await api.post("/sessoes", {
        id_filme: idFilme,
        id_sala: idSala,
        horario: new Date(horario).toISOString(),
        preco,
      });

      setSessaoFormData((old) => ({
        ...initialSessaoForm,
        id_filme: old.id_filme,
        id_sala: old.id_sala,
      }));
      setFeedback({ tipo: "sucesso", texto: "Sessao cadastrada com sucesso." });
      await carregarPainel({ sessoesPage: 1 });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel cadastrar a sessao." });
    } finally {
      setSalvando(false);
    }
  }

  function editarFilme(filme) {
    setEditingId(Number(filme.id_filme));
    setFormData({
      titulo: filme.titulo || "",
      genero: filme.genero || "",
      classificacao_etaria: filme.classificacao_etaria || "",
      duracao: filme.duracao || "",
      sinopse: filme.sinopse || "",
      poster_url: filme.poster_url || "",
      data_lancamento: filme.data_lancamento
        ? new Date(filme.data_lancamento).toISOString().slice(0, 10)
        : "",
    });
    setFeedback({ tipo: "", texto: "" });
  }

  async function removerFilme(idFilme) {
    const confirmar = window.confirm("Tem certeza que deseja remover este filme?");
    if (!confirmar) return;

    try {
      await api.delete(`/filmes/${idFilme}`);
      setFeedback({ tipo: "sucesso", texto: "Filme removido com sucesso." });

      if (editingId === Number(idFilme)) {
        limparFormulario();
      }

      await carregarPainel();
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel remover o filme." });
    }
  }

  function editarSala(sala) {
    setEditingSalaId(Number(sala.id_sala));
    setSalaEditData({
      nome: String(sala.nome || ""),
      capacidade: String(sala.capacidade || ""),
    });
    setFeedback({ tipo: "", texto: "" });
  }

  async function salvarEdicaoSala(event) {
    event.preventDefault();
    if (!editingSalaId) return;

    const nome = String(salaEditData.nome || "").trim();
    const capacidade = Number(salaEditData.capacidade || 0);

    if (!nome) {
      setFeedback({ tipo: "erro", texto: "Informe o nome da sala." });
      return;
    }

    if (!Number.isFinite(capacidade) || capacidade <= 0) {
      setFeedback({ tipo: "erro", texto: "A capacidade da sala deve ser maior que zero." });
      return;
    }

    setSalvando(true);
    setFeedback({ tipo: "", texto: "" });

    try {
      await api.put(`/salas/${editingSalaId}`, { nome, capacidade });
      limparEdicaoSala();
      setFeedback({ tipo: "sucesso", texto: "Sala atualizada com sucesso." });
      await carregarPainel({ salasPage });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel atualizar a sala." });
    } finally {
      setSalvando(false);
    }
  }

  async function removerSala(idSala) {
    const confirmar = window.confirm("Tem certeza que deseja remover esta sala?");
    if (!confirmar) return;

    try {
      await api.delete(`/salas/${idSala}`);
      if (editingSalaId === Number(idSala)) {
        limparEdicaoSala();
      }
      setFeedback({ tipo: "sucesso", texto: "Sala removida com sucesso." });
      await carregarPainel({ salasPage: 1 });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel remover a sala." });
    }
  }

  function editarSessao(sessao) {
    setEditingSessaoId(Number(sessao.id_sessao));
    setSessaoEditData({
      id_filme: String(sessao.id_filme || ""),
      id_sala: String(sessao.id_sala || ""),
      horario: sessao.horario ? new Date(sessao.horario).toISOString().slice(0, 16) : "",
      preco: String(sessao.preco || ""),
    });
    setFeedback({ tipo: "", texto: "" });
  }

  async function salvarEdicaoSessao(event) {
    event.preventDefault();
    if (!editingSessaoId) return;

    const idFilme = Number(sessaoEditData.id_filme || 0);
    const idSala = Number(sessaoEditData.id_sala || 0);
    const horario = String(sessaoEditData.horario || "").trim();
    const preco = Number(sessaoEditData.preco || 0);

    if (!idFilme || !idSala || !horario || !Number.isFinite(preco) || preco <= 0) {
      setFeedback({ tipo: "erro", texto: "Preencha filme, sala, horario e preco validos." });
      return;
    }

    setSalvando(true);
    setFeedback({ tipo: "", texto: "" });

    try {
      await api.put(`/sessoes/${editingSessaoId}`, {
        id_filme: idFilme,
        id_sala: idSala,
        horario: new Date(horario).toISOString(),
        preco,
      });
      limparEdicaoSessao();
      setFeedback({ tipo: "sucesso", texto: "Sessao atualizada com sucesso." });
      await carregarPainel({ sessoesPage });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel atualizar a sessao." });
    } finally {
      setSalvando(false);
    }
  }

  async function removerSessao(idSessao) {
    const confirmar = window.confirm("Tem certeza que deseja remover esta sessao?");
    if (!confirmar) return;

    try {
      await api.delete(`/sessoes/${idSessao}`);
      if (editingSessaoId === Number(idSessao)) {
        limparEdicaoSessao();
      }
      setFeedback({ tipo: "sucesso", texto: "Sessao removida com sucesso." });
      await carregarPainel({ sessoesPage: 1 });
    } catch (error) {
      setFeedback({ tipo: "erro", texto: error.message || "Nao foi possivel remover a sessao." });
    }
  }

  const filmesMap = useMemo(
    () => new Map(filmesCatalogo.map((filme) => [Number(filme.id_filme), filme])),
    [filmesCatalogo]
  );

  const salasMap = useMemo(
    () => new Map(salasCatalogo.map((sala) => [Number(sala.id_sala), sala])),
    [salasCatalogo]
  );

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>Painel Administrativo (ADM)</h2>
        <p className="admin-subtitle">Cadastre filmes, salas e sessoes para manter o cinema completo e atualizado.</p>

        <form className="admin-filme-form" onSubmit={salvarFilme}>
          <h3>{tituloFormulario}</h3>

          <label>Titulo</label>
          <input name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ex: Vingadores" />

          <div className="admin-grid-2">
            <div>
              <label>Genero</label>
              <input name="genero" value={formData.genero} onChange={handleChange} placeholder="Acao" />
            </div>
            <div>
              <label>Classificacao</label>
              <input name="classificacao_etaria" value={formData.classificacao_etaria} onChange={handleChange} placeholder="14" />
            </div>
          </div>

          <div className="admin-grid-2">
            <div>
              <label>Duracao (min)</label>
              <input name="duracao" type="number" min="1" value={formData.duracao} onChange={handleChange} placeholder="120" />
            </div>
            <div>
              <label>Data de lancamento</label>
              <input name="data_lancamento" type="date" value={formData.data_lancamento} onChange={handleChange} />
            </div>
          </div>

          <label>Poster (URL)</label>
          <input name="poster_url" value={formData.poster_url} onChange={handleChange} placeholder="https://..." />

          <label>Sinopse</label>
          <textarea name="sinopse" rows="4" value={formData.sinopse} onChange={handleChange} placeholder="Resumo do filme" />

          <div className="admin-acoes-form">
            <button type="submit" disabled={salvando}>{salvando ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}</button>
            {editingId && (
              <button type="button" className="btn-secundario" onClick={limparFormulario}>Cancelar edicao</button>
            )}
          </div>
        </form>

        <form className="admin-filme-form admin-bloco" onSubmit={salvarSala}>
          <h3>Cadastrar nova sala</h3>

          <label>Nome da sala</label>
          <input
            name="nome"
            value={salaFormData.nome}
            onChange={handleSalaChange}
            placeholder="Ex: Sala 1"
          />

          <label>Capacidade</label>
          <input
            name="capacidade"
            type="number"
            min="1"
            value={salaFormData.capacidade}
            onChange={handleSalaChange}
            placeholder="40"
          />

          <label className="checkbox-inline">
            <input
              type="checkbox"
              name="gerarAssentos"
              checked={salaFormData.gerarAssentos}
              onChange={handleSalaChange}
            />
            Gerar assentos automaticamente para a sala
          </label>

          <div className="admin-acoes-form">
            <button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Cadastrar sala"}</button>
          </div>
        </form>

        <form className="admin-filme-form admin-bloco" onSubmit={salvarSessao}>
          <h3>Cadastrar nova sessao</h3>

          <div className="admin-grid-2">
            <div>
              <label>Filme</label>
              <select name="id_filme" value={sessaoFormData.id_filme} onChange={handleSessaoChange}>
                <option value="">Selecione</option>
                {filmesCatalogo.map((filme) => (
                  <option key={filme.id_filme} value={filme.id_filme}>{filme.titulo}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Sala</label>
              <select name="id_sala" value={sessaoFormData.id_sala} onChange={handleSessaoChange}>
                <option value="">Selecione</option>
                {salasCatalogo.map((sala) => (
                  <option key={sala.id_sala} value={sala.id_sala}>{sala.nome} ({sala.capacidade} lugares)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-grid-2">
            <div>
              <label>Data e horario</label>
              <input name="horario" type="datetime-local" value={sessaoFormData.horario} onChange={handleSessaoChange} />
            </div>
            <div>
              <label>Preco (R$)</label>
              <input name="preco" type="number" step="0.01" min="0.01" value={sessaoFormData.preco} onChange={handleSessaoChange} placeholder="25.00" />
            </div>
          </div>

          <div className="admin-acoes-form">
            <button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Cadastrar sessao"}</button>
          </div>
        </form>

        {editingSalaId && (
          <form className="admin-filme-form admin-bloco" onSubmit={salvarEdicaoSala}>
            <h3>Editar sala</h3>

            <label>Nome da sala</label>
            <input
              name="nome"
              value={salaEditData.nome}
              onChange={(event) => setSalaEditData((old) => ({ ...old, nome: event.target.value }))}
            />

            <label>Capacidade</label>
            <input
              name="capacidade"
              type="number"
              min="1"
              value={salaEditData.capacidade}
              onChange={(event) => setSalaEditData((old) => ({ ...old, capacidade: event.target.value }))}
            />

            <div className="admin-acoes-form">
              <button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar sala"}</button>
              <button type="button" className="btn-secundario" onClick={limparEdicaoSala}>Cancelar</button>
            </div>
          </form>
        )}

        {editingSessaoId && (
          <form className="admin-filme-form admin-bloco" onSubmit={salvarEdicaoSessao}>
            <h3>Editar sessao</h3>

            <div className="admin-grid-2">
              <div>
                <label>Filme</label>
                <select
                  name="id_filme"
                  value={sessaoEditData.id_filme}
                  onChange={(event) => setSessaoEditData((old) => ({ ...old, id_filme: event.target.value }))}
                >
                  <option value="">Selecione</option>
                  {filmesCatalogo.map((filme) => (
                    <option key={filme.id_filme} value={filme.id_filme}>{filme.titulo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Sala</label>
                <select
                  name="id_sala"
                  value={sessaoEditData.id_sala}
                  onChange={(event) => setSessaoEditData((old) => ({ ...old, id_sala: event.target.value }))}
                >
                  <option value="">Selecione</option>
                  {salasCatalogo.map((sala) => (
                    <option key={sala.id_sala} value={sala.id_sala}>{sala.nome} ({sala.capacidade} lugares)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-grid-2">
              <div>
                <label>Data e horario</label>
                <input
                  name="horario"
                  type="datetime-local"
                  value={sessaoEditData.horario}
                  onChange={(event) => setSessaoEditData((old) => ({ ...old, horario: event.target.value }))}
                />
              </div>
              <div>
                <label>Preco (R$)</label>
                <input
                  name="preco"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sessaoEditData.preco}
                  onChange={(event) => setSessaoEditData((old) => ({ ...old, preco: event.target.value }))}
                />
              </div>
            </div>

            <div className="admin-acoes-form">
              <button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar sessao"}</button>
              <button type="button" className="btn-secundario" onClick={limparEdicaoSessao}>Cancelar</button>
            </div>
          </form>
        )}

        {feedback.texto && <p className={`feedback ${feedback.tipo}`}>{feedback.texto}</p>}

        <section className="admin-lista">
          <h3>Filmes cadastrados</h3>
          {loading && <p>Carregando filmes...</p>}
          {!loading && filmes.length === 0 && <p>Nenhum filme cadastrado.</p>}

          {!loading && filmes.length > 0 && (
            <div className="admin-filmes-grid">
              {filmes.map((filme) => (
                <article key={filme.id_filme} className="admin-filme-item">
                  <img src={filme.poster_url || "https://i.imgur.com/8w1NikM.jpg"} alt={filme.titulo} />
                  <div>
                    <h4>{filme.titulo}</h4>
                    <p><strong>Genero:</strong> {filme.genero || "-"}</p>
                    <p><strong>Duracao:</strong> {filme.duracao ? `${filme.duracao} min` : "-"}</p>
                    <p><strong>Classificacao:</strong> {filme.classificacao_etaria || "-"}</p>
                  </div>
                  <div className="admin-filme-botoes">
                    <button type="button" onClick={() => editarFilme(filme)}>Editar</button>
                    <button type="button" className="btn-remover" onClick={() => removerFilme(filme.id_filme)}>Remover</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && filmes.length > 0 && (
            <AdminPagination meta={filmesMeta} onChange={(nextPage) => carregarFilmes(nextPage)} />
          )}
        </section>

        <section className="admin-lista">
          <h3>Salas cadastradas</h3>
          {loading && <p>Carregando salas...</p>}
          {!loading && salas.length === 0 && <p>Nenhuma sala cadastrada.</p>}

          {!loading && salas.length > 0 && (
            <div className="admin-simples-grid">
              {salas.map((sala) => (
                <article key={sala.id_sala} className="admin-simples-item">
                  <h4>{sala.nome || `Sala ${sala.id_sala}`}</h4>
                  <p><strong>Capacidade:</strong> {sala.capacidade} lugares</p>
                  <div className="admin-filme-botoes">
                    <button type="button" onClick={() => editarSala(sala)}>Editar</button>
                    <button type="button" className="btn-remover" onClick={() => removerSala(sala.id_sala)}>Remover</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && salas.length > 0 && (
            <AdminPagination meta={salasMeta} onChange={(nextPage) => carregarSalas(nextPage)} />
          )}
        </section>

        <section className="admin-lista">
          <h3>Sessoes cadastradas</h3>
          {loading && <p>Carregando sessoes...</p>}
          {!loading && sessoes.length === 0 && <p>Nenhuma sessao cadastrada.</p>}

          {!loading && sessoes.length > 0 && (
            <div className="admin-simples-grid">
              {sessoes.map((sessao) => {
                const filme = filmesMap.get(Number(sessao.id_filme));
                const sala = salasMap.get(Number(sessao.id_sala));

                return (
                  <article key={sessao.id_sessao} className="admin-simples-item">
                    <h4>{filme?.titulo || `Filme #${sessao.id_filme || "-"}`}</h4>
                    <p><strong>Sala:</strong> {sala?.nome || `Sala #${sessao.id_sala || "-"}`}</p>
                    <p><strong>Horario:</strong> {sessao.horario ? new Date(sessao.horario).toLocaleString("pt-BR") : "-"}</p>
                    <p><strong>Preco:</strong> R$ {Number(sessao.preco || 0).toFixed(2)}</p>
                    <div className="admin-filme-botoes">
                      <button type="button" onClick={() => editarSessao(sessao)}>Editar</button>
                      <button type="button" className="btn-remover" onClick={() => removerSessao(sessao.id_sessao)}>Remover</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && sessoes.length > 0 && (
            <AdminPagination meta={sessoesMeta} onChange={(nextPage) => carregarSessoes(nextPage)} />
          )}
        </section>
      </section>
    </main>
  );
}

export default AdminFilmes;
