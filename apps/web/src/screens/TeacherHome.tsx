import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
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

const GRADE_OPTIONS = ["1ano", "2ano", "3ano", "4ano", "5ano", "6ano", "7ano", "8ano", "9ano"] as const;

export default function TeacherHome() {
  const navigate = useNavigate();
  const { user, token, signOut } = useAuth();

  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  const [title, setTitle] = useState("Prova");
  const [subject, setSubject] = useState<Subject>("physics");
  const [grade, setGrade] = useState<(typeof GRADE_OPTIONS)[number]>("1ano");
  const [mode, setMode] = useState<ExamMode>("MIXED");
  const [count, setCount] = useState(3);

  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [exams, setExams] = useState<ExamDTO[]>([]);
  const [examId, setExamId] = useState("");
  const [rendered, setRendered] = useState<RenderExamResponse | null>(null);

  const canCompose = !!token && selectedTopics.length > 0 && Number.isFinite(count) && count > 0;

  async function refresh() {
    if (!token) return;
    setError("");
    setLoadingList(true);
    try {
      const items = await listExams({ token });
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
  }, [token]);

  useEffect(() => {
    loadTopics();
  }, [token, subject, grade]);

  function toggleTopic(t: string) {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function onCompose() {
    if (!token) return;
    setError("");
    try {
      const created = await composeExam({
        token,
        payload: {
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
      navigate(`/teacher/exams/${created.exam._id}`);
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
    if (topicsLoading) return <div className="card-meta">Carregando topics...</div>;
    if (!topics.length) return <div className="card-meta">Nenhum topic para esse filtro.</div>;

    return (
      <div className="topics">
        {topics.map((t) => (
          <label key={t} className="topic-item">
            <input type="checkbox" checked={selectedTopics.includes(t)} onChange={() => toggleTopic(t)} />
            <span>{t}</span>
          </label>
        ))}
      </div>
    );
  }, [topics, topicsLoading, selectedTopics]);

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <h1>Professor</h1>
          <div className="subtitle">Provas e banco de questões</div>
        </div>

        <div className="userbar">
          <span>{user?.name}</span>
          <button className="btn btn-ghost" onClick={() => navigate("/teacher/questions")}>
            Questões
          </button>
          <button className="btn btn-ghost" onClick={signOut}>
            Sair
          </button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Compor prova</h2>
          <span className="pill">Selecionados: {selectedTopics.length}</span>
        </div>

        <div className="form-grid">
          <div className="field" style={{ gridColumn: "span 12" }}>
            <span className="label">Título</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 4" }}>
            <span className="label">Disciplina</span>
            <select className="select" value={subject} onChange={(e) => setSubject(e.target.value as Subject)}>
              <option value="physics">physics</option>
              <option value="geography">geography</option>
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 3" }}>
            <span className="label">Série</span>
            <select className="select" value={grade} onChange={(e) => setGrade(e.target.value as (typeof GRADE_OPTIONS)[number])}>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 3" }}>
            <span className="label">Tipo</span>
            <select className="select" value={mode} onChange={(e) => setMode(e.target.value as ExamMode)}>
              <option value="MIXED">MIXED</option>
              <option value="MCQ">MCQ</option>
              <option value="DISC">DISC</option>
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 2" }}>
            <span className="label">Quantidade</span>
            <input className="input" type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>

          <div style={{ gridColumn: "span 12", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={onCompose} disabled={!canCompose}>
              Compor e abrir
            </button>

            <button className="btn btn-ghost" onClick={refresh} disabled={loadingList}>
              {loadingList ? "Carregando..." : "Atualizar lista"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="split">
            <div className="card-meta">Topics disponíveis para o filtro selecionado</div>
            {topicsLoading ? <span className="kbd">loading</span> : <span className="kbd">{topics.length} topics</span>}
          </div>
          {topicsUi}
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Minhas provas</h2>
            <div className="card-meta">Total: {exams.length}</div>
          </div>

          <ul className="list">
            {exams.map((ex) => (
              <li key={ex._id} className="list-item">
                <div className="exam-row">
                  <div>
                    <button className="btn btn-ghost" style={{ height: 34, padding: "0 10px" }} onClick={() => navigate(`/teacher/exams/${ex._id}`)}>
                      Abrir
                    </button>
                    <div className="exam-title" style={{ marginTop: 8 }}>
                      {ex.title}
                    </div>
                    <div className="exam-sub">
                      {ex.subject} | {ex.grade} | {ex.topics.join(", ")}
                    </div>
                    <div className="exam-id">
                      <span className="kbd">{ex._id}</span>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="btn btn-ghost" onClick={() => onRender(ex._id, "A")}>
                      A
                    </button>
                    <button className="btn btn-ghost" onClick={() => onRender(ex._id, "B")}>
                      B
                    </button>
                    <button className="btn btn-danger" onClick={() => onDelete(ex._id)}>
                      Deletar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Prévia rápida</h2>
            <div className="card-meta">
              ExamId: {examId ? <span className="kbd">{examId}</span> : <span className="kbd">-</span>}
            </div>
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
                {rendered.questions.slice(0, 3).map((q) => (
                  <li key={q.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700 }}>{q.statement}</div>
                  </li>
                ))}
              </ol>

              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" disabled={!examId} onClick={() => navigate(`/teacher/exams/${examId}`)}>
                  Abrir página completa
                </button>
              </div>
            </div>
          ) : (
            <div className="card-meta">Use A/B em uma prova para pré-visualizar. Para ver completo, use Abrir.</div>
          )}
        </div>
      </section>
    </div>
  );
}