import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import logo from "../assets/logo.png";

type Props = {
  schoolName?: string;
  roleLabel?: string;
  children: ReactNode;
};

export default function AppShell({ schoolName = "Colégio Estadual Shirlei Regina Santos", roleLabel, children }: Props) {
  const { user, signOut } = useAuth();
  const loc = useLocation();

  const isTeacher = user?.role === "TEACHER";

  const links = isTeacher
    ? [
        { to: "/teacher", label: "Home" },
        { to: "/teacher/compose", label: "Compor" },
        { to: "/teacher/exams", label: "Provas" },
        { to: "/teacher/questions", label: "Questões" }
      ]
    : [{ to: "/student", label: "Home" }];

  const active = (to: string) => (loc.pathname === to ? "btn btn-primary" : "btn btn-ghost");

  return (
    <div className="shell">
      <div style={{ width: "100%" }}>
        <header className="header">
          <div className="header-inner">
            <div className="school">
              <div className="school-mark">
                <img src={logo} alt="Logo" style={{ width: 30, height: 30, objectFit: "contain" }} />
              </div>
              <div className="school-title">
                <strong>{schoolName}</strong>
                <span>{roleLabel || (isTeacher ? "Portal do Professor" : "Portal do Aluno")}</span>
              </div>
            </div>

            <nav className="navlinks">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className={active(l.to)} style={{ height: 36, padding: "0 12px" }}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="userbar">
              <span>{user?.name}</span>
              <button className="btn btn-ghost" style={{ height: 36, padding: "0 12px" }} onClick={signOut}>
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="container">{children}</main>
      </div>
    </div>
  );
}