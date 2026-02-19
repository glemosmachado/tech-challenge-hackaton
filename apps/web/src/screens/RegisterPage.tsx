import { useContext, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/context";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await signUp({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "REGISTER_FAILED";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <div className="card auth-card">
        <div className="auth-head">
          <h1>Criar conta</h1>
          <p>Crie seu acesso para usar o sistema.</p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field" style={{ gridColumn: "span 12" }}>
              <span className="label">Nome</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome" />
            </div>

            <div className="field" style={{ gridColumn: "span 12" }}>
              <span className="label">Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seuemail@escola.gov.br"
              />
            </div>

            <div className="field" style={{ gridColumn: "span 12" }}>
              <span className="label">Perfil</span>
              <select className="select" value={role} onChange={(e) => setRole(e.target.value as "TEACHER" | "STUDENT")}>
                <option value="TEACHER">Professor</option>
                <option value="STUDENT">Aluno</option>
              </select>
            </div>

            <div className="field" style={{ gridColumn: "span 12" }}>
              <span className="label">Senha</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="field" style={{ gridColumn: "span 12" }}>
              <span className="label">Confirmar senha</span>
              <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Repita a senha" />
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Criando..." : "Criar conta"}
              </button>
            </div>
          </div>
        </form>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Ao criar, você já entra automaticamente.</div>
          <Link to="/login" style={{ fontSize: 12, fontWeight: 650 }}>
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}