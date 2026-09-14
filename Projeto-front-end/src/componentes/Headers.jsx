import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Headers.css";

function Header(){
    const { session, isLoggedIn, isAdmin, clearSession } = useAuth();
    const nomeLogado = String(session?.nome || session?.email || "").trim();
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const accountMenuRef = useRef(null);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!accountMenuRef.current?.contains(event.target)) {
                setAccountMenuOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setAccountMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    function handleLogout() {
        clearSession();
        window.location.href = "/login";
    }

    return(
        <header className="header">
        {/* ÁREA DA LOGO E DO NOME DA LOJA */}
            <div className="logo">
                <h1>CINE MAX</h1>
                <span className="logo_subtitle">Sua sala de estreia</span>
            </div>

        {/* ÁREA DO MENU DE NAVEGAÇÃO */}
        <nav className="menu_header" aria-label="Menu principal">
            <div className="menu_links_principais">
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/contato">Contato</NavLink>
                <NavLink to="/sobre">Sobre</NavLink>
                {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                {isLoggedIn && <NavLink to="/minhas-compras">Minhas Compras</NavLink>}
            </div>

            <div className="menu_area_conta">
                {isLoggedIn ? (
                    <div className="conta-dropdown" ref={accountMenuRef}>
                        <button
                            type="button"
                            className="usuario-logado usuario-trigger"
                            title={nomeLogado}
                            onClick={() => setAccountMenuOpen((old) => !old)}
                            aria-expanded={accountMenuOpen}
                            aria-haspopup="menu"
                        >
                            <span>{nomeLogado}</span>
                            <span className="seta-menu">▾</span>
                        </button>

                        {accountMenuOpen && (
                            <div className="dropdown-menu" role="menu">
                                <NavLink to="/perfil" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Meu Perfil</NavLink>
                                <button type="button" className="dropdown-sair" role="menuitem" onClick={handleLogout}>Sair</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <NavLink to="/login" className="btn-logar">Logar</NavLink>
                )}
            </div>
        </nav>
        </header>
    );
}

export default Header;