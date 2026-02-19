import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

function TileIcon({ kind }: { kind: "compose" | "exams" | "questions" }) {
  if (kind === "compose") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 7h10M7 12h10M7 17h6" stroke="var(--pr-blue)" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="var(--pr-blue)" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "exams") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4h10v16H7z" stroke="var(--pr-blue)" strokeWidth="2" />
        <path d="M9 8h6M9 12h6M9 16h4" stroke="var(--pr-green)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="var(--pr-blue)" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7v10" stroke="var(--pr-green)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function TeacherDashboardPage() {
  const nav = useNavigate();

  return (
    <AppShell>
      <div className="topbar">
        <div className="brand">
          <h1>Home</h1>
          <div className="subtitle">Ações do professor</div>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Atalhos</h2>
          <div className="card-meta">Escolha uma ação</div>
        </div>

        <div className="tiles">
          <div className="tile" role="button" tabIndex={0} onClick={() => nav("/teacher/compose")}>
            <div className="tile-head">
              <div>
                <p className="tile-title">Compor prova</p>
                <p className="tile-desc">Criar prova A/B com filtros e topics</p>
              </div>
              <div className="tile-icon">
                <TileIcon kind="compose" />
              </div>
            </div>
            <div className="tile-foot">
              <span className="kbd">/teacher/compose</span>
              <span className="kbd">A/B</span>
            </div>
          </div>

          <div className="tile" role="button" tabIndex={0} onClick={() => nav("/teacher/exams")}>
            <div className="tile-head">
              <div>
                <p className="tile-title">Provas criadas</p>
                <p className="tile-desc">Abrir, visualizar A/B e deletar</p>
              </div>
              <div className="tile-icon">
                <TileIcon kind="exams" />
              </div>
            </div>
            <div className="tile-foot">
              <span className="kbd">/teacher/exams</span>
              <span className="kbd">read/delete</span>
            </div>
          </div>

          <div className="tile" role="button" tabIndex={0} onClick={() => nav("/teacher/questions")}>
            <div className="tile-head">
              <div>
                <p className="tile-title">Banco de questões</p>
                <p className="tile-desc">Criar, editar e deletar questões</p>
              </div>
              <div className="tile-icon">
                <TileIcon kind="questions" />
              </div>
            </div>
            <div className="tile-foot">
              <span className="kbd">/teacher/questions</span>
              <span className="kbd">CRUD</span>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}