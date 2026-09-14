import { NavLink } from "react-router-dom";

function AdminNav() {
  return (
    <nav className="menu_header" aria-label="Navegacao administrativa">
      <div className="menu_links_principais">
        <NavLink to="/admin">Painel</NavLink>
        <NavLink to="/admin/filmes">Filmes</NavLink>
        <NavLink to="/admin/salas">Salas</NavLink>
        <NavLink to="/admin/sessoes">Sessoes</NavLink>
      </div>
    </nav>
  );
}

export default AdminNav;
