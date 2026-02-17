import { useState, useContext } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../auth/context";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp({ name, email, password, role });
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "REGISTER_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={handleSubmit} style={{ width: 360, padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
        <h1 style={{ marginBottom: 16 }}>Criar conta</h1>

        {error ? <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 10, marginBottom: 12 }}>{error}</div> : null}

        <label style={{ display: "block", marginBottom: 6 }}>Nome</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 8, marginBottom: 12 }} />

        <label style={{ display: "block", marginBottom: 6 }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: 8, marginBottom: 12 }} />

        <label style={{ display: "block", marginBottom: 6 }}>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 8, marginBottom: 12 }} />

        <label style={{ display: "block", marginBottom: 6 }}>Perfil</label>
        <select value={role} onChange={(e) => setRole(e.target.value as "TEACHER" | "STUDENT")} style={{ width: "100%", padding: 8, marginBottom: 16 }}>
          <option value="TEACHER">Professor</option>
          <option value="STUDENT">Aluno</option>
        </select>

        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Criando..." : "Criar"}
        </button>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          Já tem conta? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}
