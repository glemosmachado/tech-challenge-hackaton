import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/useAuth";
import { listStudents, type StudentDTO } from "../lib/api";
import "../styles/students.css";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function fmtDate(s?: string) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "A";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function TeacherStudentsPage() {
  const { token } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const items = await listStudents({ token });
      setStudents(items);
    } catch (e) {
      setError(msg(e, "LIST_STUDENTS_FAILED"));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return students;
    return students.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }, [students, search]);

  return (
    <AppShell>
      <div className="students-wrap">
        <div className="students-head">
          <div>
            <h1 className="students-title">Alunos</h1>
            <div className="students-sub">Lista de alunos cadastrados</div>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <section className="students-panel">
          <div className="students-toolbar">
            <span className="students-pill">Total: {students.length}</span>

            <div className="students-actions" style={{ marginLeft: "auto" }}>
              <input
                className="input students-input"
                placeholder="Buscar por nome ou email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-primary" onClick={refresh} disabled={loading}>
                {loading ? "Carregando..." : "Atualizar"}
              </button>
            </div>
          </div>

          <div className="students-table">
            <div className="students-row head">
              <div className="student-cell">Aluno</div>
              <div className="student-cell">Email</div>
              <div className="student-cell">Criado em</div>
              <div className="student-cell" style={{ textAlign: "right" }}>
                Papel
              </div>
            </div>

            {filtered.map((u) => (
              <div key={u._id} className="students-row item">
                <div className="student-cell">
                  <div className="student-main">
                    <div className="student-avatar">{initials(u.name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="student-name">{u.name}</div>
                      <div className="student-email" style={{ opacity: 0.7 }}>
                        ID: {u._id}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="student-cell">
                  <div className="student-email">{u.email}</div>
                </div>

                <div className="student-cell">
                  <div className="student-date">{fmtDate(u.createdAt)}</div>
                </div>

                <div className="student-tag">STUDENT</div>
              </div>
            ))}

            {!filtered.length ? <div className="students-empty">Nenhum aluno encontrado.</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}