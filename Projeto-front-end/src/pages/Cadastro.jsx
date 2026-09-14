import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./Cadastro.css";

function Cadastro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {};

    const cpfNumerico = formData.cpf.replace(/\D/g, "");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.nome.trim()) {
      nextErrors.nome = "Informe seu nome completo.";
    }

    if (!cpfNumerico) {
      nextErrors.cpf = "Informe seu CPF.";
    } else if (!isValidCPF(cpfNumerico)) {
      nextErrors.cpf = "Informe um CPF valido.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Informe um e-mail valido.";
    } else if (!emailRegex.test(formData.email.trim())) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (formData.telefone.replace(/\D/g, "").length < 10) {
      nextErrors.telefone = "Informe um telefone com DDD.";
    }

    const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!senhaForteRegex.test(formData.senha)) {
      nextErrors.senha =
        "A senha deve ter no minimo 8 caracteres, incluindo maiuscula, minuscula, numero e simbolo.";
    }

    if (formData.confirmarSenha !== formData.senha) {
      nextErrors.confirmarSenha = "As senhas nao conferem.";
    }

    return nextErrors;
  }

  function isValidCPF(cpf) {
    if (!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const nums = cpf.split("").map(Number);

    const calcDigit = (base, factor) => {
      const total = base.reduce((acc, value) => {
        const result = acc + value * factor;
        factor -= 1;
        return result;
      }, 0);
      const mod = (total * 10) % 11;
      return mod === 10 ? 0 : mod;
    };

    const d1 = calcDigit(nums.slice(0, 9), 10);
    const d2 = calcDigit(nums.slice(0, 10), 11);

    return d1 === nums[9] && d2 === nums[10];
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
      await api.post("/users", {
        nome: formData.nome.trim(),
        cpf: formData.cpf.replace(/\D/g, ""),
        email: formData.email.trim(),
        senha: formData.senha,
        tipo_usuario: "cliente",
      });

      setMessage("Cadastro concluido com sucesso. Redirecionando para o login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setMessage(error.message || "Nao foi possivel concluir o cadastro.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="cadastro-title">
        <p className="auth-badge">Crie sua conta</p>
        <h2 id="cadastro-title">Cadastro</h2>
        <p className="auth-subtitle">
          Cadastre-se para comprar mais rapido e salvar seus filmes favoritos.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="nome">Nome completo</label>
          <input
            id="nome"
            name="nome"
            type="text"
            placeholder="Seu nome"
            value={formData.nome}
            onChange={handleChange}
            autoComplete="name"
          />
          {errors.nome && <small className="error-text">{errors.nome}</small>}

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

          <label htmlFor="cpf">CPF</label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={handleChange}
            autoComplete="off"
          />
          {errors.cpf && <small className="error-text">{errors.cpf}</small>}

          <label htmlFor="telefone">Telefone</label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={formData.telefone}
            onChange={handleChange}
            autoComplete="tel"
          />
          {errors.telefone && (
            <small className="error-text">{errors.telefone}</small>
          )}

          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            placeholder="8+ caracteres, com maiuscula, numero e simbolo"
            value={formData.senha}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.senha && <small className="error-text">{errors.senha}</small>}

          <label htmlFor="confirmarSenha">Confirmar senha</label>
          <input
            id="confirmarSenha"
            name="confirmarSenha"
            type="password"
            placeholder="Repita sua senha"
            value={formData.confirmarSenha}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.confirmarSenha && (
            <small className="error-text">{errors.confirmarSenha}</small>
          )}

          <button type="submit">Criar conta</button>

          {message && <p className="status-text">{message}</p>}
        </form>

        <p className="auth-footer">
          Ja tem conta? <Link to="/login">Fazer login</Link>
        </p>
      </section>
    </main>
  );
}

export default Cadastro;
