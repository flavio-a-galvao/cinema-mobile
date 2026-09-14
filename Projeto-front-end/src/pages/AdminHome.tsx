import { Link } from "react-router-dom";
import AdminNav from "../componentes/common/AdminNav";
import "./AdminFilmes.css";

function AdminHome() {
  return (
    <main className="admin-filmes-page">
      <section className="admin-filmes-card">
        <h2>Painel Administrativo</h2>
        <p className="admin-subtitle">Gerencie filmes, salas e sessoes em telas separadas de listagem e formulario.</p>
        <AdminNav />

        <div className="admin-simples-grid">
          <article className="admin-simples-item">
            <h4>Filmes</h4>
            <Link to="/admin/filmes">Abrir filmes</Link>
          </article>
          <article className="admin-simples-item">
            <h4>Salas</h4>
            <Link to="/admin/salas">Abrir salas</Link>
          </article>
          <article className="admin-simples-item">
            <h4>Sessoes</h4>
            <Link to="/admin/sessoes">Abrir sessoes</Link>
          </article>
        </div>
      </section>
    </main>
  );
}

export default AdminHome;
