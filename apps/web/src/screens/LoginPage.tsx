import { useState, useContext } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/context";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "LOGIN_FAILED";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <div className="card auth-card">
        <div className="auth-head">
          <h1>Acesso</h1>
          <p>Entre com seu e-mail e senha para acessar o sistema.</p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
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
              <span className="label">Senha</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
              />
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </div>
        </form>

        <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>
          Dica: use o mesmo login do Postman.
        </div>
      </div>
    </div>
  );
}