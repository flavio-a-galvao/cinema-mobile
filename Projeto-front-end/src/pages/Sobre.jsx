import "./Sobre.css";

function Sobre() {
  return (
    <main className="sobre-page">
      <section className="sobre-hero">
        <div className="sobre-overlay" />
        <div className="sobre-conteudo">
          <p className="sobre-tag">Desde 2018</p>
          <h1>Sobre o CINE MAX</h1>
          <p>
            Mais que um cinema, o CINE MAX e um destino para quem ama historias.
            Unimos tecnologia de imagem, audio imersivo e atendimento premium para
            transformar cada sessao em uma noite inesquecivel.
          </p>
        </div>
      </section>

      <section className="sobre-cards">
        <article>
          <h2>Experiencia de Tela Grande</h2>
          <p>
            Nossas salas contam com projecao de alta definicao, contraste intenso
            e poltronas confortaveis para voce curtir cada cena com o maximo de detalhe.
          </p>
        </article>

        <article>
          <h2>Audio Envolvente</h2>
          <p>
            Som calibrado em cada sala para voce sentir os graves, os dialogos e a trilha
            sonora exatamente como o diretor planejou.
          </p>
        </article>

        <article>
          <h2>Atendimento Premium</h2>
          <p>
            Da compra online ao combo na bomboniere, nosso foco e oferecer praticidade,
            conforto e um ambiente elegante em todos os detalhes.
          </p>
        </article>
      </section>
    </main>
  );
}

export default Sobre;
