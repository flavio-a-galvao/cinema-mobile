import { NavLink } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="footer-cinemax">
      <div className="footer-grid">
        <section>
          <h3>CINE MAX</h3>
          <p>
            Onde cada sessao vira uma experiencia memoravel, com conforto,
            tecnologia e grandes historias na tela.
          </p>
        </section>

        <section>
          <h4>Navegacao</h4>
          <nav className="footer-links" aria-label="Links do rodape">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/sobre">Sobre</NavLink>
            <NavLink to="/contato">Contato</NavLink>
            <NavLink to="/produtos">Ingressos</NavLink>
          </nav>
        </section>

        <section>
          <h4>Atendimento</h4>
          <p>contato@cinemax.com</p>
          <p>(11) 4002-8922</p>
          <p>Shopping Centro, Sao Paulo - SP</p>
        </section>
      </div>

      <div className="footer-bottom">
        <small>© {anoAtual} CINE MAX. Todos os direitos reservados.</small>
      </div>
    </footer>
  );
}

export default Footer;
