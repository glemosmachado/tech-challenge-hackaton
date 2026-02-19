import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/useAuth";
import {
  createQuestion,
  deleteQuestion,
  getTopics,
  listQuestions,
  updateQuestion,
  type CreateQuestionPayload,
  type Difficulty,
  type QuestionDTO,
  type QuestionType,
  type Subject
} from "../lib/api";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

const GRADE_OPTIONS = ["1ano", "2ano", "3ano", "4ano", "5ano", "6ano", "7ano", "8ano", "9ano"] as const;
const DIFFICULTY_OPTIONS: Difficulty[] = ["easy", "medium", "hard"];
const TYPE_FILTER: Array<"" | QuestionType> = ["", "MCQ", "DISC"];

function emptyDraft(): CreateQuestionPayload {
  return {
    subject: "physics",
    grade: "1ano",
    topic: "",
    difficulty: "easy",
    type: "MCQ",
    statement: "",
    options: ["", "", "", ""],
    correctIndex: 0
  };
}

export default function TeacherQuestionsPage() {
  const { token } = useAuth();

  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);

  const [subject, setSubject] = useState<Subject>("physics");
  const [grade, setGrade] = useState<(typeof GRADE_OPTIONS)[number]>("1ano");
  const [topic, setTopic] = useState<string>("");
  const [type, setType] = useState<"" | QuestionType>("");
  const [difficulty, setDifficulty] = useState<"" | Difficulty>("");

  const [topics, setTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [draft, setDraft] = useState<CreateQuestionPayload>(emptyDraft());

  const selected = useMemo(() => questions.find((q) => q._id === selectedId) ?? null, [questions, selectedId]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return questions;
    return questions.filter((q) => q.statement.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s));
  }, [questions, search]);

  const loadTopics = useCallback(async () => {
    if (!token) return;
    setTopicsLoading(true);
    setError("");
    try {
      const t = await getTopics({ token, subject, grade });
      setTopics(t);
      setTopic((prev) => (prev && t.includes(prev) ? prev : ""));
    } catch (e) {
      setTopics([]);
      setTopic("");
      setError(msg(e, "TOPICS_FAILED"));
    } finally {
      setTopicsLoading(false);
    }
  }, [token, subject, grade]);

  const loadQuestions = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    setError("");
    try {
      const list = await listQuestions({
        token,
        subject,
        grade,
        topic: topic || undefined,
        type: type || undefined,
        difficulty: difficulty || undefined
      });
      setQuestions(list);
      setSelectedId("");
    } catch (e) {
      setQuestions([]);
      setSelectedId("");
      setError(msg(e, "LIST_QUESTIONS_FAILED"));
    } finally {
      setLoadingList(false);
    }
  }, [token, subject, grade, topic, type, difficulty]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (!selected) return;
    if (selected.type === "MCQ") {
      setDraft({
        subject: selected.subject,
        grade: selected.grade,
        topic: selected.topic,
        difficulty: selected.difficulty,
        type: "MCQ",
        statement: selected.statement,
        options: (selected.options ?? []).map((x) => x ?? ""),
        correctIndex: typeof selected.correctIndex === "number" ? selected.correctIndex : 0
      });
      return;
    }
    setDraft({
      subject: selected.subject,
      grade: selected.grade,
      topic: selected.topic,
      difficulty: selected.difficulty,
      type: "DISC",
      statement: selected.statement,
      expectedAnswer: selected.expectedAnswer ?? "",
      rubric: selected.rubric ?? ""
    });
  }, [selectedId, selected]);

  const onNew = useCallback(() => {
    setSelectedId("");
    setDraft({
      ...emptyDraft(),
      subject,
      grade
    });
  }, [subject, grade]);

  const setOption = useCallback((i: number, value: string) => {
    setDraft((prev) => {
      if (prev.type !== "MCQ") return prev;
      const opts = [...prev.options];
      opts[i] = value;
      return { ...prev, options: opts };
    });
  }, []);

  const normalizedMCQ = useCallback((payload: CreateQuestionPayload) => {
    if (payload.type !== "MCQ") return payload;
    const cleaned = payload.options.map((o) => o.trim()).filter(Boolean);
    return { ...payload, options: cleaned };
  }, []);

  const validateDraft = useCallback((payload: CreateQuestionPayload): string | null => {
    if (!payload.topic.trim()) return "Topic é obrigatório.";
    if (!payload.statement.trim()) return "Enunciado é obrigatório.";
    if (payload.type === "MCQ") {
      const cleaned = payload.options.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length < 2) return "MCQ precisa ter no mínimo 2 alternativas preenchidas.";
      if (!Number.isInteger(payload.correctIndex) || payload.correctIndex < 0 || payload.correctIndex >= cleaned.length) {
        return "Índice da alternativa correta inválido.";
      }
    }
    return null;
  }, []);

  const onSave = useCallback(async () => {
    if (!token) return;
    setError("");

    setSaving(true);
    try {
      const payload = draft.type === "MCQ" ? normalizedMCQ(draft) : draft;
      const err = validateDraft(payload);
      if (err) {
        setError(err);
        setSaving(false);
        return;
      }

      if (selectedId) {
        const updated = await updateQuestion({ token, id: selectedId, payload });
        setQuestions((prev) => prev.map((q) => (q._id === updated._id ? updated : q)));
      } else {
        const created = await createQuestion({ token, payload });
        setQuestions((prev) => [created, ...prev]);
        setSelectedId(created._id);
      }
      setError("");
    } catch (e) {
      setError(msg(e, "SAVE_FAILED"));
    } finally {
      setSaving(false);
    }
  }, [token, draft, selectedId, normalizedMCQ, validateDraft]);

  const onDelete = useCallback(async () => {
    if (!token || !selectedId) return;
    setError("");
    setSaving(true);
    try {
      await deleteQuestion({ token, id: selectedId });
      setQuestions((prev) => prev.filter((q) => q._id !== selectedId));
      setSelectedId("");
      onNew();
    } catch (e) {
      setError(msg(e, "DELETE_FAILED"));
    } finally {
      setSaving(false);
    }
  }, [token, selectedId, onNew]);

  const rightTitle = selectedId ? "Editar questão" : "Nova questão";

  return (
    <AppShell>
      <div className="topbar">
        <div className="brand">
          <h1>Questões</h1>
          <div className="subtitle">Cadastro e manutenção do banco</div>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Filtros</h2>
          <div className="card-meta">{loadingList ? "Carregando..." : `${questions.length} no filtro`}</div>
        </div>

        <div className="form-grid">
          <div className="field" style={{ gridColumn: "span 12 / span 3" }}>
            <span className="label">Disciplina</span>
            <select className="select" value={subject} onChange={(e) => setSubject(e.target.value as Subject)}>
              <option value="physics">physics</option>
              <option value="geography">geography</option>
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 2" }}>
            <span className="label">Série</span>
            <select className="select" value={grade} onChange={(e) => setGrade(e.target.value as (typeof GRADE_OPTIONS)[number])}>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 3" }}>
            <span className="label">Topic</span>
            <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={topicsLoading}>
              <option value="">{topicsLoading ? "Carregando..." : "Todos"}</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 2" }}>
            <span className="label">Tipo</span>
            <select className="select" value={type} onChange={(e) => setType(e.target.value as "" | QuestionType)}>
              {TYPE_FILTER.map((v) => (
                <option key={v || "ALL"} value={v}>{v || "Todos"}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12 / span 2" }}>
            <span className="label">Dificuldade</span>
            <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as "" | Difficulty)}>
              <option value="">Todas</option>
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "span 12" }}>
            <span className="label">Buscar</span>
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtre por enunciado ou topic" />
          </div>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Lista</h2>
            <div className="card-meta">{filtered.length} exibidas</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={onNew}>Nova</button>
            <button className="btn btn-ghost" onClick={loadQuestions} disabled={loadingList}>
              {loadingList ? "Carregando..." : "Recarregar"}
            </button>
          </div>

          <ul className="list" style={{ marginTop: 0 }}>
            {filtered.map((q) => (
              <li key={q._id} className="list-item">
                <div className="exam-row" style={{ gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div className="exam-title" style={{ fontSize: 14 }}>{q.topic}</div>
                    <div className="exam-sub">{q.subject} | {q.grade} | {q.type} | {q.difficulty}</div>
                    <div className="exam-sub" style={{ marginTop: 6, color: "var(--text)" }}>
                      {q.statement.length > 140 ? q.statement.slice(0, 140) + "..." : q.statement}
                    </div>
                    <div className="exam-id" style={{ marginTop: 6 }}>
                      <span className="kbd">{q._id}</span>
                    </div>
                  </div>

                  <div className="actions">
                    <button className={selectedId === q._id ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setSelectedId(q._id)}>
                      {selectedId === q._id ? "Selecionada" : "Editar"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{rightTitle}</h2>
            <div className="card-meta">{selectedId ? <span className="kbd">{selectedId}</span> : "Criar nova"}</div>
          </div>

          <div className="form-grid">
            <div className="field" style={{ gridColumn: "span 12 / span 4" }}>
              <span className="label">Disciplina</span>
              <select className="select" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value as Subject })}>
                <option value="physics">physics</option>
                <option value="geography">geography</option>
              </select>
            </div>

            <div className="field" style={{ gridColumn: "span 12 / span 3" }}>
              <span className="label">Série</span>
              <select className="select" value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: e.target.value })}>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ gridColumn: "span 12 / span 5" }}>
              <span className="label">Topic</span>
              <input className="input" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} placeholder="ex: kinematics" />
            </div>

            <div className="field" style={{ gridColumn: "span 12 / span 4" }}>
              <span className="label">Tipo</span>
              <select
                className="select"
                value={draft.type}
                onChange={(e) => {
                  const next = e.target.value as QuestionType;
                  if (next === "MCQ") {
                    setDraft({
                      subject: draft.subject,
                      grade: draft.grade,
                      topic: draft.topic,
                      difficulty: draft.difficulty,
                      type: "MCQ",
                      statement: draft.statement,
                      options: ["", "", "", ""],
                      correctIndex: 0
                    });
                  } else {
                    setDraft({
                      subject: draft.subject,
                      grade: draft.grade,
                      topic: draft.topic,
                      difficulty: draft.difficulty,
                      type: "DISC",
                      statement: draft.statement,
                      expectedAnswer: "",
                      rubric: ""
                    });
                  }
                }}
              >
                <option value="MCQ">MCQ</option>
                <option value="DISC">DISC</option>
              </select>
            </div>

            <div className="field" style={{ gridColumn: "span 12 / span 4" }}>
              <span className="label">Dificuldade</span>
              <select className="select" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty } as CreateQuestionPayload)}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ gridColumn: "span 12 / span 4" }}>
              <span className="label">Ação</span>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                  {saving ? "Salvando..." : selectedId ? "Salvar" : "Criar"}
                </button>
                <button className="btn btn-danger" onClick={onDelete} disabled={!selectedId || saving}>Deletar</button>
              </div>
            </div>

            <div className="field" style={{ gridColumn: "span 12" }}>
              <span className="label">Enunciado</span>
              <textarea
                className="input"
                value={draft.statement}
                onChange={(e) => setDraft({ ...draft, statement: e.target.value } as CreateQuestionPayload)}
                style={{ height: 120, paddingTop: 10, paddingBottom: 10, resize: "vertical" }}
              />
            </div>

            {draft.type === "MCQ" ? (
              <>
                <div className="field" style={{ gridColumn: "span 12" }}>
                  <span className="label">Alternativas</span>
                  <div style={{ display: "grid", gap: 10 }}>
                    {draft.options.map((opt, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span className="kbd">{String.fromCharCode(65 + idx)}</span>
                        <input className="input" value={opt} onChange={(e) => setOption(idx, e.target.value)} style={{ flex: 1 }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field" style={{ gridColumn: "span 12 / span 6" }}>
                  <span className="label">Alternativa correta</span>
                  <select className="select" value={draft.correctIndex} onChange={(e) => setDraft({ ...draft, correctIndex: Number(e.target.value) })}>
                    {draft.options.map((_, idx) => (
                      <option key={idx} value={idx}>{String.fromCharCode(65 + idx)}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="field" style={{ gridColumn: "span 12" }}>
                  <span className="label">Resposta esperada</span>
                  <textarea className="input" value={draft.expectedAnswer ?? ""} onChange={(e) => setDraft({ ...draft, expectedAnswer: e.target.value })} style={{ height: 90, paddingTop: 10, paddingBottom: 10, resize: "vertical" }} />
                </div>

                <div className="field" style={{ gridColumn: "span 12" }}>
                  <span className="label">Rubrica</span>
                  <textarea className="input" value={draft.rubric ?? ""} onChange={(e) => setDraft({ ...draft, rubric: e.target.value })} style={{ height: 90, paddingTop: 10, paddingBottom: 10, resize: "vertical" }} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}