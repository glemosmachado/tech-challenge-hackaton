import { useEffect, useState } from "react";
import {
  composeExam,
  createQuestion,
  listQuestions,
  renderExam,
  type Question
} from "./lib/api";

const TEACHER_ID = "demo-teacher";

export default function App() {
  const [filters, setFilters] = useState({
    teacherId: TEACHER_ID,
    subject: "math",
    grade: "7ano",
    topic: "fractions"
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [newStatement, setNewStatement] = useState("Qual é a fração equivalente a 1/2?");
  const [newOptions, setNewOptions] = useState("2/4\n1/3\n3/5\n5/8");
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  const [examId, setExamId] = useState<string>("");
  const [rendered, setRendered] = useState<any>(null);

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const data = await listQuestions(filters);
      setQuestions(data.items);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao listar questions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreateQuestion() {
    setError("");
    try {
      const opts = newOptions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await createQuestion({
        teacherId: filters.teacherId,
        subject: filters.subject,
        grade: filters.grade,
        topic: filters.topic,
        difficulty: "easy",
        type: "MCQ",
        statement: newStatement,
        options: opts,
        correctIndex: newCorrectIndex
      });

      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao criar question");
    }
  }

  async function onComposeExam() {
    setError("");
    try {
      const created = await composeExam({
        teacherId: filters.teacherId,
        title: "Prova automática - Frações",
        subject: filters.subject,
        grade: filters.grade,
        topic: filters.topic,
        qty: 3
      });
      setExamId(created._id);
      setRendered(null);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao compor exam");
    }
  }

  async function onRender(version: "A" | "B") {
    if (!examId) return;
    setError("");
    try {
      const data = await renderExam(examId, version);
      setRendered(data);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao renderizar exam");
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Construtor de Provas</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <label>
          Subject
          <input
            value={filters.subject}
            onChange={(e) => setFilters((p) => ({ ...p, subject: e.target.value }))}
            style={{ display: "block", width: 200 }}
          />
        </label>

        <label>
          Grade
          <input
            value={filters.grade}
            onChange={(e) => setFilters((p) => ({ ...p, grade: e.target.value }))}
            style={{ display: "block", width: 200 }}
          />
        </label>

        <label>
          Topic
          <input
            value={filters.topic}
            onChange={(e) => setFilters((p) => ({ ...p, topic: e.target.value }))}
            style={{ display: "block", width: 200 }}
          />
        </label>

        <button onClick={refresh} disabled={loading} style={{ height: 40, alignSelf: "end" }}>
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </div>

      {error ? (
        <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h2>Nova questão (MCQ)</h2>

        <label style={{ display: "block", marginBottom: 8 }}>
          Enunciado
          <input
            value={newStatement}
            onChange={(e) => setNewStatement(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Opções (1 por linha)
          <textarea
            value={newOptions}
            onChange={(e) => setNewOptions(e.target.value)}
            rows={4}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Índice correto (0..3)
          <input
            type="number"
            value={newCorrectIndex}
            onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
            style={{ display: "block", width: 120 }}
          />
        </label>

        <button onClick={onCreateQuestion}>Salvar questão</button>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h2>Banco de questões</h2>

        <div style={{ marginBottom: 8 }}>
          Total carregado: {questions.length}
        </div>

        <ul>
          {questions.map((q) => (
            <li key={q._id} style={{ marginBottom: 8 }}>
              <div><strong>{q.statement}</strong></div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {q.subject} | {q.grade} | {q.topic} | {q.difficulty} | {q.type}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Prova</h2>

        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={onComposeExam}>Compor prova (A/B)</button>
          <button onClick={() => onRender("A")} disabled={!examId}>Render A</button>
          <button onClick={() => onRender("B")} disabled={!examId}>Render B</button>
          <div style={{ alignSelf: "center" }}>
            ExamId: <code>{examId || "-"}</code>
          </div>
        </div>

        {rendered ? (
          <div>
            <h3>{rendered.exam.title} (Versão {rendered.exam.version})</h3>
            <ol>
              {rendered.questions.map((q: any) => (
                <li key={q.id} style={{ marginBottom: 12 }}>
                  <div><strong>{q.statement}</strong></div>
                  {q.type === "MCQ" ? (
                    <ul>
                      {q.options.map((opt: string, idx: number) => (
                        <li key={idx}>
                          {opt} {q.answerKey === idx ? <strong>(correta)</strong> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>Resposta: {String(q.answerKey)}</div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div style={{ opacity: 0.75 }}>Nenhuma prova renderizada ainda.</div>
        )}
      </section>
    </div>
  );
}