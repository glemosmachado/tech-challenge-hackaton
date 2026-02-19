import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/useAuth";
import { composeExam, getTopics, type ExamMode, type Subject } from "../lib/api";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

const GRADE_OPTIONS = ["1ano", "2ano", "3ano", "4ano", "5ano", "6ano", "7ano", "8ano", "9ano"] as const;

export default function TeacherComposeExamPage() {
  const nav = useNavigate();
  const { token } = useAuth();

  const [error, setError] = useState("");
  const [title, setTitle] = useState("Prova");
  const [subject, setSubject] = useState<Subject>("physics");
  const [grade, setGrade] = useState<(typeof GRADE_OPTIONS)[number]>("1ano");
  const [mode, setMode] = useState<ExamMode>("MIXED");
  const [count, setCount] = useState(10);

  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canCompose = !!token && selectedTopics.length > 0 && Number.isFinite(count) && count > 0;

  const loadTopics = useCallback(async () => {
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
  }, [token, subject, grade]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const toggleTopic = useCallback((t: string) => {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }, []);

  const onCompose = useCallback(async () => {
    if (!token) return;
    setError("");
    setSaving(true);
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
      nav(`/teacher/exams/${created.exam._id}`);
    } catch (e) {
      setError(msg(e, "COMPOSE_FAILED"));
    } finally {
      setSaving(false);
    }
  }, [token, title, subject, grade, selectedTopics, count, mode, nav]);

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
  }, [topics, topicsLoading, selectedTopics, toggleTopic]);

  return (
    <AppShell>
      <div className="topbar">
        <div className="brand">
          <h1>Compor</h1>
          <div className="subtitle">Criação de prova (A/B)</div>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Parâmetros</h2>
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
            <button className="btn btn-primary" onClick={onCompose} disabled={!canCompose || saving}>
              {saving ? "Criando..." : "Criar e abrir"}
            </button>

            <button className="btn btn-ghost" onClick={loadTopics} disabled={topicsLoading}>
              {topicsLoading ? "Carregando..." : "Atualizar topics"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="split">
            <div className="card-meta">Topics disponíveis</div>
            <span className="kbd">{topics.length}</span>
          </div>
          {topicsUi}
        </div>
      </section>
    </AppShell>
  );
}