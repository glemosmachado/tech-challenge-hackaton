import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  composeExam,
  deleteExam,
  getTopics,
  listExams,
  renderExam,
  type ExamDTO,
  type ExamMode,
  type ExamVersion,
  type RenderExamResponse,
  type Subject
} from "../lib/api";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export default function TeacherHome() {
  const { user, token, signOut } = useAuth();

  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  const [title, setTitle] = useState("Prova");
  const [subject, setSubject] = useState<Subject>("physics");
  const [grade, setGrade] = useState("1ano");
  const [mode, setMode] = useState<ExamMode>("MIXED");
  const [count, setCount] = useState(3);

  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [exams, setExams] = useState<ExamDTO[]>([]);
  const [examId, setExamId] = useState("");
  const [rendered, setRendered] = useState<RenderExamResponse | null>(null);

  const canCompose = !!token && !!user && selectedTopics.length > 0 && Number.isFinite(count) && count > 0;

  async function refresh() {
    if (!token || !user) return;
    setError("");
    setLoadingList(true);
    try {
      const items = await listExams({ token, teacherId: user.id });
      setExams(items);
    } catch (e) {
      setError(msg(e, "LIST_EXAMS_FAILED"));
    } finally {
      setLoadingList(false);
    }
  }

  async function loadTopics() {
    if (!token) return;
    setError("");
    setTopicsLoading(true);
    try {
      const t = await getTopics({ token, subject, grade });
      setTopics(t);
      setSelectedTopics((prev) => prev.filter((x) => t.includes(x)));
    } catch (e) {
      setTopics([]);
      setSelectedTopics([]);
      setError(msg(e, "TOPICS_FAILED"));
    } finally {
      setTopicsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [token, user?.id]);

  useEffect(() => {
    loadTopics();
  }, [token, subject, grade]);

  function toggleTopic(t: string) {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function onCompose() {
    if (!token || !user) return;
    setError("");
    try {
      const created = await composeExam({
        token,
        payload: {
          teacherId: user.id,
          title,
          subject,
          grade,
          topics: selectedTopics,
          count,
          mode
        }
      });
      setExamId(created.exam._id);
      setRendered(null);
      await refresh();
    } catch (e) {
      setError(msg(e, "COMPOSE_FAILED"));
    }
  }

  async function onRender(id: string, version: ExamVersion) {
    if (!token) return;
    setError("");
    try {
      const data = await renderExam({ token, examId: id, version, audience: "teacher" });
      setExamId(id);
      setRendered(data);
    } catch (e) {
      setError(msg(e, "RENDER_FAILED"));
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    setError("");
    try {
      await deleteExam({ token, examId: id });
      if (examId === id) {
        setExamId("");
        setRendered(null);
      }
      await refresh();
    } catch (e) {
      setError(msg(e, "DELETE_FAILED"));
    }
  }

  const topicsUi = useMemo(() => {
    if (topicsLoading) return <div>Carregando topics...</div>;
    if (!topics.length) return <div>Nenhum topic para esse filtro.</div>;

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginTop: 8 }}>
        {topics.map((t) => (
          <label key={t} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={selectedTopics.includes(t)} onChange={() => toggleTopic(t)} />
            <span>{t}</span>
          </label>
        ))}
      </div>
    );
  }, [topics, topicsLoading, selectedTopics]);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1>Professor</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>{user?.name}</span>
          <button onClick={signOut}>Sair</button>
        </div>
      </div>

      {error ? <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, marginBottom: 16 }}>{error}</div> : null}

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
            Tipo
            <select value={mode} onChange={(e) => setMode(e.target.value as ExamMode)} style={{ display: "block", width: 140 }}>
              <option value="MIXED">MIXED</option>
              <option value="MCQ">MCQ</option>
              <option value="DISC">DISC</option>
            </select>
          </label>

          <label>
            Quantidade
            <input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ display: "block", width: 120 }} />
          </label>

          <button onClick={onCompose} disabled={!canCompose} style={{ height: 40, alignSelf: "end" }}>
            Compor
          </button>

          <button onClick={refresh} disabled={loadingList} style={{ height: 40, alignSelf: "end" }}>
            {loadingList ? "Carregando..." : "Atualizar lista"}
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <strong>Topics</strong>
            <span style={{ opacity: 0.8 }}>Selecionados: {selectedTopics.length}</span>
          </div>
          {topicsUi}
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
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{ex.subject} | {ex.grade} | {ex.topics.join(", ")}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}><code>{ex._id}</code></div>
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
          <div style={{ marginBottom: 8 }}>ExamId: <code>{examId || "-"}</code></div>

          {rendered ? (
            <div>
              <h3>{rendered.exam.title} (Versão {rendered.exam.version})</h3>

              <ol>
                {rendered.questions.map((q) => (
                  <li key={q.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{q.statement}</div>

                    {q.type === "MCQ" ? (
                      <ul>
                        {q.options.map((opt, idx) => (
                          <li key={idx}>
                            {opt}
                            {"answerKey" in q && typeof q.answerKey === "number" && q.answerKey === idx ? <strong> (correta)</strong> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ marginTop: 6 }}>
                        {"expectedAnswer" in q ? (
                          <>
                            <div><strong>Resposta esperada:</strong> {q.expectedAnswer ?? "-"}</div>
                            <div><strong>Rubrica:</strong> {q.rubric ?? "-"}</div>
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