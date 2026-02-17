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

      // redirecionamento simples após login
      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1e1e1e",
        color: "#fff"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          padding: 24,
          background: "#2a2a2a",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
        }}
      >
        <h1 style={{ marginBottom: 20 }}>Login</h1>

        {error && (
          <div
            style={{
              background: "#5a2a2a",
              padding: 10,
              marginBottom: 16,
              borderRadius: 4,
              fontSize: 14
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: "block", marginBottom: 6 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 16,
            borderRadius: 4,
            border: "1px solid #444",
            background: "#111",
            color: "#fff"
          }}
        />

        <label style={{ display: "block", marginBottom: 6 }}>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 20,
            borderRadius: 4,
            border: "1px solid #444",
            background: "#111",
            color: "#fff"
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#000",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}