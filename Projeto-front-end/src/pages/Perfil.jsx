import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import "./Perfil.css";

function Perfil() {
  const { session, setSession } = useAuth();
  const isLoggedIn = Boolean(session?.email && session?.id_usuario);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ tipo: "", texto: "" });

  const userId = useMemo(() => Number(session?.id_usuario || 0), [session]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    async function loadUser() {
      setLoading(true);
      setMessage({ tipo: "", texto: "" });

      try {
        const user = await api.get(`/users/${userId}`);
        setFormData((old) => ({
          ...old,
          nome: String(user?.nome || ""),
          cpf: String(user?.cpf || ""),
          email: String(user?.email || ""),
        }));
      } catch (error) {
        setMessage({ tipo: "erro", texto: error.message || "Nao foi possivel carregar seu perfil." });
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [isLoggedIn, userId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((old) => ({ ...old, [name]: value }));
  }

  function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
  }

  function isValidCPF(cpf) {
    const cleanCpf = String(cpf || "").replace(/\D/g, "");
    if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) return false;

    const digits = cleanCpf.split("").map(Number);
    const calcDigit = (base, factor) => {
      const total = base.reduce((acc, value) => {
        const result = acc + value * factor;
        factor -= 1;
        return result;
      }, 0);
      const mod = (total * 10) % 11;
      return mod === 10 ? 0 : mod;
    };

    const d1 = calcDigit(digits.slice(0, 9), 10);
    const d2 = calcDigit(digits.slice(0, 10), 11);
    return d1 === digits[9] && d2 === digits[10];
  }

  function validate() {
    const nextErrors = {};

    if (!formData.nome.trim()) {
      nextErrors.nome = "Informe seu nome completo.";
    }

    if (!formData.cpf.trim()) {
      nextErrors.cpf = "Informe seu CPF.";
    } else if (!isValidCPF(formData.cpf)) {
      nextErrors.cpf = "Informe um CPF valido.";
    }

    if (!formData.senha) {
      nextErrors.senha = "Informe uma nova senha.";
    } else if (!isStrongPassword(formData.senha)) {
      nextErrors.senha = "Senha fraca. Use 8+ caracteres com maiuscula, minuscula, numero e simbolo.";
    }

    if (formData.confirmarSenha !== formData.senha) {
      nextErrors.confirmarSenha = "A confirmacao de senha nao confere.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage({ tipo: "", texto: "" });
      return;
    }

    try {
      await api.put(`/users/${userId}`, {
        nome: formData.nome.trim(),
        cpf: formData.cpf.replace(/\D/g, ""),
        email: formData.email.trim(),
        senha: formData.senha,
      });

      const nextSession = {
        ...session,
        nome: formData.nome.trim(),
      };

      setSession(nextSession);

      setFormData((old) => ({ ...old, senha: "", confirmarSenha: "" }));
      setMessage({ tipo: "sucesso", texto: "Perfil atualizado com sucesso." });
    } catch (error) {
      setMessage({ tipo: "erro", texto: error.message || "Nao foi possivel atualizar seu perfil." });
    }
  }

  if (!isLoggedIn) {
    return <Navigate to="/login?redirect=/perfil" replace />;
  }

  return (
    <main className="perfil-page">
      <section className="perfil-card">
        <h2>Meu Perfil</h2>
        <p className="perfil-subtitle">Atualize seus dados. O e-mail nao pode ser alterado.</p>

        {loading ? (
          <p>Carregando perfil...</p>
        ) : (
          <form className="perfil-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="nome">Nome</label>
            <input id="nome" name="nome" value={formData.nome} onChange={handleChange} />
            {errors.nome && <small className="error-text">{errors.nome}</small>}

            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" value={formData.email} disabled />

            <label htmlFor="cpf">CPF</label>
            <input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="00000000000" />
            {errors.cpf && <small className="error-text">{errors.cpf}</small>}

            <label htmlFor="senha">Nova senha</label>
            <input id="senha" name="senha" type="password" value={formData.senha} onChange={handleChange} />
            {errors.senha && <small className="error-text">{errors.senha}</small>}

            <label htmlFor="confirmarSenha">Confirmar nova senha</label>
            <input id="confirmarSenha" name="confirmarSenha" type="password" value={formData.confirmarSenha} onChange={handleChange} />
            {errors.confirmarSenha && <small className="error-text">{errors.confirmarSenha}</small>}

            <button type="submit">Salvar alteracoes</button>

            {message.texto && <p className={`perfil-msg ${message.tipo}`}>{message.texto}</p>}
          </form>
        )}
      </section>
    </main>
  );
}

export default Perfil;
