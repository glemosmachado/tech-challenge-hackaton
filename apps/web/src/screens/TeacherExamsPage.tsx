import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/useAuth";
import { deleteExam, listExams, type ExamDTO } from "../lib/api";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export default function TeacherExamsPage() {
  const nav = useNavigate();
  const { token } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<ExamDTO[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const items = await listExams({ token });
      setExams(items);
    } catch (e) {
      setError(msg(e, "LIST_EXAMS_FAILED"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!token) return;
      setError("");
      try {
        await deleteExam({ token, examId: id });
        setExams((prev) => prev.filter((x) => x._id !== id));
      } catch (e) {
        setError(msg(e, "DELETE_FAILED"));
      }
    },
    [token]
  );

  return (
    <AppShell>
      <div className="topbar">
        <div className="brand">
          <h1>Provas</h1>
          <div className="subtitle">Abrir, visualizar e deletar</div>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Lista</h2>
          <div className="card-meta">Total: {exams.length}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={() => nav("/teacher/compose")}>Compor nova</button>
          <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>

        <ul className="list">
          {exams.map((ex) => (
            <li key={ex._id} className="list-item">
              <div className="exam-row">
                <div>
                  <div className="exam-title">{ex.title}</div>
                  <div className="exam-sub">
                    {ex.subject} | {ex.grade} | {ex.topics.join(", ")}
                  </div>
                  <div className="exam-id">
                    <span className="kbd">{ex._id}</span>
                  </div>
                </div>

                <div className="actions">
                  <button className="btn btn-primary" onClick={() => nav(`/teacher/exams/${ex._id}`)}>Abrir</button>
                  <button className="btn btn-danger" onClick={() => onDelete(ex._id)}>Deletar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}