import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { useAuth } from "./context/AuthContext";
import Header from "./componentes/Headers.jsx";
import Footer from "./componentes/Footer.jsx";
import AdminHome from "./pages/AdminHome";
import AdminFilmesList from "./pages/AdminFilmesList";
import AdminFilmeForm from "./pages/AdminFilmeForm";
import AdminSalasList from "./pages/AdminSalasList";
import AdminSalaForm from "./pages/AdminSalaForm";
import AdminSessoesList from "./pages/AdminSessoesList";
import AdminSessaoForm from "./pages/AdminSessaoForm";
import Contato from "./pages/Contato.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import MinhasCompras from "./pages/MinhasCompras.jsx";
import Pagamento from "./pages/Pagamento.jsx";
import Perfil from "./pages/Perfil.jsx";
import Produtos from "./pages/Produtos.jsx";
import Sobre from "./pages/Sobre.jsx";

function App() {
  const { isLoggedIn, isAdmin } = useAuth();

  const adminGuard = (element: ReactElement) => (isAdmin ? element : <Navigate to="/" replace />);

  return (
    <div className="app-shell">
      <Header />
      <div className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/pagamento" element={<Pagamento />} />

          <Route
            path="/perfil"
            element={isLoggedIn ? <Perfil /> : <Navigate to="/login?redirect=/perfil" replace />}
          />

          <Route path="/admin" element={adminGuard(<AdminHome />)} />
          <Route path="/admin/filmes" element={adminGuard(<AdminFilmesList />)} />
          <Route path="/admin/filmes/novo" element={adminGuard(<AdminFilmeForm mode="create" />)} />
          <Route path="/admin/filmes/:id/editar" element={adminGuard(<AdminFilmeForm mode="edit" />)} />

          <Route path="/admin/salas" element={adminGuard(<AdminSalasList />)} />
          <Route path="/admin/salas/nova" element={adminGuard(<AdminSalaForm mode="create" />)} />
          <Route path="/admin/salas/:id/editar" element={adminGuard(<AdminSalaForm mode="edit" />)} />

          <Route path="/admin/sessoes" element={adminGuard(<AdminSessoesList />)} />
          <Route path="/admin/sessoes/nova" element={adminGuard(<AdminSessaoForm mode="create" />)} />
          <Route path="/admin/sessoes/:id/editar" element={adminGuard(<AdminSessaoForm mode="edit" />)} />

          <Route
            path="/minhas-compras"
            element={isLoggedIn ? <MinhasCompras /> : <Navigate to="/login?redirect=/minhas-compras" replace />}
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
