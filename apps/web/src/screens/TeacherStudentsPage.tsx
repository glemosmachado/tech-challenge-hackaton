import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useAuth } from "../auth/useAuth";
import { listStudents, type StudentDTO } from "../lib/api";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function fmtDate(s?: string) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
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
      <div className="page-head">
        <div>
          <h1 className="page-title">Alunos</h1>
          <div className="page-sub">Lista de alunos cadastrados</div>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="panel">
        <div className="panel-head">
          <h2>Alunos</h2>
          <span className="panel-meta">Total: {students.length}</span>
        </div>

        <div className="row">
          <input className="input" placeholder="Buscar por nome ou email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={refresh} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>

        <div className="table">
          <div className="tr head">
            <div>Nome</div>
            <div>Email</div>
            <div>Criado em</div>
          </div>

          {filtered.map((u) => (
            <div key={u._id} className="tr">
              <div className="td-strong">{u.name}</div>
              <div className="td-mono">{u.email}</div>
              <div className="td-muted">{fmtDate(u.createdAt)}</div>
            </div>
          ))}

          {!filtered.length ? <div className="empty">Nenhum aluno encontrado.</div> : null}
        </div>
      </section>
    </AppShell>
  );
}