import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { renderExam, type ExamVersion, type RenderExamResponse } from "../lib/api";

function msg(e: unknown) {
  return e instanceof Error ? e.message : "OPEN_FAILED";
}

export default function StudentHome() {
  const { user, token, signOut } = useAuth();

  const [examId, setExamId] = useState("");
  const [version, setVersion] = useState<ExamVersion>("A");
  const [error, setError] = useState("");
  const [rendered, setRendered] = useState<RenderExamResponse | null>(null);

  async function onOpen() {
    if (!token) return;
    setError("");
    setRendered(null);
    try {
      const data = await renderExam({ token, examId: examId.trim(), version, audience: "student" });
      setRendered(data);
    } catch (e) {
      setError(msg(e));
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1>Aluno</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>{user?.name}</span>
          <button onClick={signOut}>Sair</button>
        </div>
      </div>

      {error ? <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, marginBottom: 16 }}>{error}</div> : null}

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h2>Abrir prova</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label>
            ExamId
            <input value={examId} onChange={(e) => setExamId(e.target.value)} style={{ display: "block", width: 360 }} />
          </label>

          <label>
            Versão
            <select value={version} onChange={(e) => setVersion(e.target.value as ExamVersion)} style={{ display: "block", width: 120 }}>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </label>

          <button onClick={onOpen} style={{ height: 40, alignSelf: "end" }}>
            Abrir
          </button>
        </div>
      </section>

      {rendered ? (
        <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2>{rendered.exam.title} (Versão {rendered.exam.version})</h2>

          <ol>
            {rendered.questions.map((q) => (
              <li key={q.id} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600 }}>{q.statement}</div>

                {q.type === "MCQ" ? (
                  <ul>
                    {q.options.map((opt, idx) => (
                      <li key={idx}>{opt}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ marginTop: 8, opacity: 0.85 }}>Responda em folha separada.</div>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div style={{ opacity: 0.75 }}>Informe o ExamId e abra a prova.</div>
      )}
    </div>
  );
}