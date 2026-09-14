import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/";
  }, [location.search]);

  const motivoCompra = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("motivo") === "compra";
  }, [location.search]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!formData.email.trim()) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!emailRegex.test(formData.email.trim())) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (!formData.senha) {
      nextErrors.senha = "Informe sua senha.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("");
      return;
    }

    try {
      const authData = await api.post("/auth/login", {
        email: formData.email,
        senha: formData.senha,
      });

      const user = authData?.user;
      const token = authData?.token;

      if (!user || !token) {
        setMessage("Nao foi possivel concluir o login.");
        return;
      }

      setSession({
        nome: user.nome,
        email: user.email,
        id_usuario: user.id_usuario,
        tipo_usuario: user.tipo_usuario,
        token,
        loggedInAt: new Date().toISOString(),
      });

      setMessage("Login realizado com sucesso. Redirecionando...");
      setTimeout(() => navigate(redirectPath), 900);
    } catch (error) {
      setMessage(error.message || "Nao foi possivel conectar com o servidor.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="auth-badge">Acesse sua conta</p>
        <h2 id="login-title">Login</h2>
        <p className="auth-subtitle">
          Entre para acompanhar pedidos, favoritos e novidades da CINE MAX.
        </p>
        {motivoCompra && (
          <p className="status-text">Faca login para concluir sua compra.</p>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="voce@email.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.email && <small className="error-text">{errors.email}</small>}

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            placeholder="Sua senha"
            value={formData.senha}
            onChange={handleChange}
            autoComplete="current-password"
          />
          {errors.senha && <small className="error-text">{errors.senha}</small>}

          <button type="submit">Entrar</button>

          {message && <p className="status-text">{message}</p>}
        </form>

        <p className="auth-footer">
          Nao tem conta? <Link to="/cadastro">Criar cadastro</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
