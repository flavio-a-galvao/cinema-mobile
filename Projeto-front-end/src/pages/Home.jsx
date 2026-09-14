import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "./Home.css";

function Home(){
    const [filmesDestaque, setFilmesDestaque] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function loadDestaques() {
            setLoading(true);
            setErro("");

            try {
                const filmes = await api.get("/catalogo/filmes");
                let sessoes = [];
                try {
                    sessoes = await api.get("/catalogo/sessoes");
                } catch {
                    sessoes = [];
                }

                const sessoesPorFilme = new Map();
                for (const sessao of sessoes) {
                    const idFilme = Number(sessao.id_filme);
                    const lista = sessoesPorFilme.get(idFilme) || [];
                    const dia = sessao.horario
                        ? new Date(sessao.horario).toLocaleDateString("pt-BR", { weekday: "short" })
                        : "Dia";
                    const hora = sessao.horario
                        ? new Date(sessao.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        : "--:--";
                    lista.push({ dia, hora });
                    sessoesPorFilme.set(idFilme, lista);
                }

                const normalizados = filmes.slice(0, 8).map((filme) => ({
                    id: Number(filme.id_filme),
                    titulo: filme.titulo,
                    genero: filme.genero || "Sem gênero",
                    duracao: filme.duracao ? `${filme.duracao} min` : null,
                    classificacao: filme.classificacao_etaria || "Livre",
                    sinopse: filme.sinopse || "",
                    horarios: (sessoesPorFilme.get(Number(filme.id_filme)) || []).slice(0, 3),
                    imagem: filme.poster_url || "https://i.imgur.com/8w1NikM.jpg",
                }));

                setFilmesDestaque(normalizados);
            } catch (error) {
                setErro(error.message || "Nao foi possivel carregar os filmes do banco.");
                setFilmesDestaque([]);
            } finally {
                setLoading(false);
            }
        }

        loadDestaques();
    }, []);

    return(
        <main className="home-cinemax">
            <section className="hero-home">
                <p className="hero-tag">Experiencia Premium</p>
                <h1>CINE MAX</h1>
                <p>
                    O cinema que transforma cada sessao em evento. Telas gigantes, som imersivo,
                    poltronas confortaveis e os melhores lancamentos da semana.
                </p>
                <div className="hero-actions">
                    <Link to="/produtos" className="btn-principal">Ver cartaz completo</Link>
                    <a href="#destaques" className="btn-secundario">Filmes em destaque</a>
                </div>
            </section>

            <section className="faixas-info">
                <article>
                    <h3>4 Salas 3D</h3>
                    <p>Tecnologia de projecao a laser e audio Dolby para uma experiencia intensa.</p>
                </article>
                <article>
                    <h3>Combo Especial</h3>
                    <p>Pipoca grande + refrigerante refil com descontos em sessoes noturnas.</p>
                </article>
                <article>
                    <h3>Assento Marcado</h3>
                    <p>Escolha seu lugar com antecedencia e entre na sala sem filas.</p>
                </article>
            </section>

            <section id="destaques" className="destaques-home">
                <div className="titulo-destaques">
                    <h2>Filmes em destaque</h2>
                    <p>Selecao especial do CINE MAX para os proximos dias.</p>
                </div>

                <div className="grid-destaques">
                    {loading && <p>Carregando filmes...</p>}
                    {!loading && erro && <p>{erro}</p>}
                    {!loading && !erro && filmesDestaque.length === 0 && (
                        <p>Nenhum filme encontrado no banco.</p>
                    )}
                    {filmesDestaque.map((filme) => (
                        <article className="card-destaque" key={filme.titulo}>
                            <div className="card-poster-wrap">
                                <img src={filme.imagem} alt={filme.titulo} />
                                <span className="card-genero-badge">{filme.genero}</span>
                                <span className="card-class-badge">{filme.classificacao}</span>
                                <div className="card-hover-overlay">
                                    <Link to={`/produtos?filme=${filme.id}`} className="btn-reservar-overlay">
                                        🎟 Reservar ingresso
                                    </Link>
                                </div>
                            </div>
                            <div className="conteudo-card">
                                <h3>{filme.titulo}</h3>
                                <div className="card-meta">
                                    {filme.duracao && <span className="meta-item">⏱ {filme.duracao}</span>}
                                    {filme.horarios.length > 0 && (
                                        <span className="meta-item">{filme.horarios.length} sessão(ões)</span>
                                    )}
                                </div>
                                {filme.sinopse && (
                                    <p className="card-sinopse">{filme.sinopse}</p>
                                )}
                                {filme.horarios.length > 0 && (
                                    <div className="horarios-card">
                                        {filme.horarios.map((sessao) => (
                                            <span key={`${sessao.dia}-${sessao.hora}`}>{sessao.dia} {sessao.hora}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default Home;