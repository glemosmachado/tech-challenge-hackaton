import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { renderExam, type RenderExamResponse } from "../lib/api";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "RENDER_FAILED";
}

export default function StudentHome() {
  const { user, token, signOut } = useAuth();

  const [examId, setExamId] = useState("");
  const [version, setVersion] = useState<"A" | "B">("A");
  const [err, setErr] = useState("");
  const [rendered, setRendered] = useState<RenderExamResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function onOpen() {
    if (!token) return;
    setErr("");
    setRendered(null);
    setLoading(true);
    try {
      const data = await renderExam({ token, examId: examId.trim(), version, audience: "student" });
      setRendered(data);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <h1>Aluno</h1>
          <div className="subtitle">Acesso a provas publicadas</div>
        </div>

        <div className="userbar">
          <span>{user?.name}</span>
          <button className="btn btn-ghost" onClick={signOut}>
            Sair
          </button>
        </div>
      </div>

      {err ? <div className="alert error">{err}</div> : null}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Abrir prova</h2>
          <div className="card-meta">Informe o ExamId e a versão.</div>
        </div>

        <div className="form-grid">
          <div className="field" style={{ gridColumn: "span 12 / span 8" }}>
            <span className="label">ExamId</span>
            <input className="input" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Cole o ExamId" />
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 2" }}>
            <span className="label">Versão</span>
            <select className="select" value={version} onChange={(e) => setVersion(e.target.value as "A" | "B")}>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </div>

          <div style={{ gridColumn: "span 12 / span 2", display: "flex", alignItems: "end" }}>
            <button className="btn btn-primary" onClick={onOpen} disabled={loading || !examId.trim()}>
              {loading ? "Abrindo..." : "Abrir"}
            </button>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2 className="card-title">Visualização</h2>
          <div className="card-meta">{rendered ? <span className="kbd">{rendered.exam.title}</span> : "Nenhuma prova carregada."}</div>
        </div>

        {rendered ? (
          <div>
            <div style={{ marginBottom: 10 }}>
              <div className="exam-title">
                {rendered.exam.title} (Versão {rendered.exam.version})
              </div>
              <div className="exam-sub">
                {rendered.exam.subject} | {rendered.exam.grade} | {rendered.exam.topics.join(", ")}
              </div>
            </div>

            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {rendered.questions.map((q) => (
                <li key={q.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700 }}>{q.statement}</div>

                  {q.type === "MCQ" ? (
                    <ul style={{ marginTop: 8 }}>
                      {q.options.map((opt, idx) => (
                        <li key={idx}>{opt}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ marginTop: 8, color: "var(--muted)" }}>Responda em folha separada.</div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="card-meta">Informe o ExamId e abra a prova.</div>
        )}
      </section>
    </div>
  );
}