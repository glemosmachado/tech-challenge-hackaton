import { useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import "../styles/teacher-home.css";

type Tile = {
  title: string;
  to: string;
  hint: string;
  icon: "compose" | "exams" | "questions" | "students" | "roadmap";
};

function Icon({ name }: { name: Tile["icon"] }) {
  if (name === "compose") {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M7 3h10a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 17h12" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 7h6M9 10h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "exams") {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M7 3h10a2 2 0 0 1 2 2v16H7a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 7h8M9 11h8M9 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "questions") {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M8 3h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 7h6M10 11h8M10 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 7v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "students") {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
        <path d="M8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 22a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 11h6M19 8v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 8l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 14h14v7H5v-7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TileCard({ t }: { t: Tile }) {
  return (
    <Link to={t.to} className="teacher-tile">
      <div className="teacher-tile-icon">
        <Icon name={t.icon} />
      </div>
      <div className="teacher-tile-title">{t.title}</div>
      <div className="teacher-tile-hint">{t.hint}</div>
    </Link>
  );
}

export default function TeacherHome() {
  const tiles = useMemo<Tile[]>(
    () => [
      { title: "Compor prova", to: "/teacher/compose", hint: "Criar prova A/B por filtros e topics", icon: "compose" },
      { title: "Provas criadas", to: "/teacher/exams", hint: "Abrir, visualizar A/B e deletar", icon: "exams" },
      { title: "Banco de questões", to: "/teacher/questions", hint: "Criar, editar e deletar questões", icon: "questions" },
      { title: "Alunos cadastrados", to: "/teacher/students", hint: "Listar e consultar alunos", icon: "students" },
      { title: "Desenvolvimentos futuros", to: "/teacher/roadmap", hint: "Backlog do projeto e próximos passos", icon: "roadmap" }
    ],
    []
  );

  return (
    <AppShell>
      <div className="teacher-home-wrap">
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, margin: "4px 0 14px" }}>
          <h1 style={{ margin: 0, fontSize: 42, letterSpacing: "-0.02em" }}>Home</h1>
          <div style={{ opacity: 0.75, fontSize: 14 }}>Ações do professor</div>
        </div>

        <section className="teacher-home-panel">
          <div className="teacher-home-panel-head">
            <h2 className="teacher-home-panel-title">Atalhos</h2>
            <span className="teacher-home-panel-meta">Escolha uma ação</span>
          </div>

          <div className="teacher-home-grid">
            {tiles.map((t) => (
              <TileCard key={t.to} t={t} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}