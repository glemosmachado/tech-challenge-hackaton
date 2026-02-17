import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Falha no login";
}

export default function LoginPage() {
  const nav = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const role = await signIn(email, password);
      nav(role === "TEACHER" ? "/teacher" : "/student", { replace: true });
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 520, margin: "40px auto" }}>
      <h1>Login</h1>

      {err ? (
        <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, marginBottom: 16 }}>
          {err}
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: "block", width: "100%" }} />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ height: 40, width: "100%" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}