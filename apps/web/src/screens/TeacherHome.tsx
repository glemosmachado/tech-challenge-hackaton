import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  composeExam,
  deleteExam,
  listExams,
  renderExam,
  type Exam,
  type RenderExamResponse,
  type Subject
} from "../lib/api";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function TeacherHome() {
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState<string>("");
  const [rendered, setRendered] = useState<RenderExamResponse | null>(null);

  const [title, setTitle] = useState("Prova - Física");
  const [subject, setSubject] = useState<Subject>("physics");
  const [grade, setGrade] = useState("1ano");
  const [topic, setTopic] = useState("cinematics");
  const [qty, setQty] = useState(3);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const data = await listExams();
      setExams(data.items);
    } catch (e) {
      setErr(getErrorMessage(e, "Erro ao listar provas"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCompose() {
    setErr("");
    try {
      const created = await composeExam({
        title,
        subject,
        grade,
        topic,
        qty,
        types: ["MCQ", "DISC"]
      });
      setExamId(created._id);
      setRendered(null);
      await refresh();
    } catch (e) {
      setErr(getErrorMessage(e, "Erro ao compor prova"));
    }
  }

  async function onRender(id: string, version: "A" | "B") {
    setErr("");
    try {
      const data = await renderExam(id, version, "teacher");
      setExamId(id);
      setRendered(data);
    } catch (e) {
      setErr(getErrorMessage(e, "Erro ao renderizar"));
    }
  }

  async function onDelete(id: string) {
    setErr("");
    try {
      await deleteExam(id);
      if (examId === id) {
        setExamId("");
        setRendered(null);
      }
      await refresh();
    } catch (e) {
      setErr(getErrorMessage(e, "Erro ao deletar"));
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1>Professor</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>{user?.name}</span>
          <button onClick={signOut}>Sair</button>
        </div>
      </div>

      {err ? (
        <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, marginBottom: 16 }}>
          {err}
        </div>
      ) : null}

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h2>Compor prova</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label>
            Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ display: "block", width: 280 }} />
          </label>

          <label>
            Disciplina
            <select value={subject} onChange={(e) => setSubject(e.target.value as Subject)} style={{ display: "block", width: 180 }}>
              <option value="physics">physics</option>
              <option value="geography">geography</option>
            </select>
          </label>

          <label>
            Série
            <input value={grade} onChange={(e) => setGrade(e.target.value)} style={{ display: "block", width: 140 }} />
          </label>

          <label>
            Topic
            <input value={topic} onChange={(e) => setTopic(e.target.value)} style={{ display: "block", width: 180 }} />
          </label>

          <label>
            Quantidade
            <input
              type="number"
              min={1}
              max={50}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{ display: "block", width: 120 }}
            />
          </label>

          <button onClick={onCompose} style={{ height: 40, alignSelf: "end" }}>
            Compor
          </button>

          <button onClick={refresh} disabled={loading} style={{ height: 40, alignSelf: "end" }}>
            {loading ? "Carregando..." : "Atualizar lista"}
          </button>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2>Minhas provas</h2>
          <div style={{ opacity: 0.8, marginBottom: 8 }}>Total: {exams.length}</div>

          <ul style={{ paddingLeft: 18 }}>
            {exams.map((ex) => (
              <li key={ex._id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ex.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {ex.subject} | {ex.grade} | {ex.topic}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      <code>{ex._id}</code>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "start", flexWrap: "wrap" }}>
                    <button onClick={() => onRender(ex._id, "A")}>A</button>
                    <button onClick={() => onRender(ex._id, "B")}>B</button>
                    <button onClick={() => onDelete(ex._id)}>Deletar</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2>Visualização (gabarito)</h2>
          <div style={{ marginBottom: 8 }}>
            ExamId: <code>{examId || "-"}</code>
          </div>

          {rendered ? (
            <div>
              <h3>
                {rendered.exam.title} (Versão {rendered.exam.version})
              </h3>

              <ol>
                {rendered.questions.map((q) => (
                  <li key={q.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{q.statement}</div>

                    {q.type === "MCQ" ? (
                      <ul>
                        {q.options.map((opt, idx) => (
                          <li key={idx}>
                            {opt}
                            {"answerKey" in q && q.answerKey === idx ? <strong> (correta)</strong> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ marginTop: 6 }}>
                        {"expectedAnswer" in q ? (
                          <>
                            <div>
                              <strong>Resposta esperada:</strong> {q.expectedAnswer ?? "-"}
                            </div>
                            <div>
                              <strong>Rubrica:</strong> {q.rubric ?? "-"}
                            </div>
                          </>
                        ) : null}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>Selecione uma prova e renderize A/B.</div>
          )}
        </div>
      </section>
    </div>
  );
}