import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "../auth/useAuth";
import LoginPage from "../screens/LoginPage";
import TeacherHome from "../screens/TeacherHome";
import StudentHome from "../screens/StudentHome";
import TeacherExamPage from "../screens/TeacherExamPage";

function RequireRole({ role, children }: { role: "TEACHER" | "STUDENT"; children: ReactElement }) {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return <div style={{ padding: 24 }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student"} replace />;
  return children;
}

export default function App() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return <div style={{ padding: 24 }}>Carregando...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/teacher"
        element={
          <RequireRole role="TEACHER">
            <TeacherHome />
          </RequireRole>
        }
      />

      <Route
        path="/teacher/exams/:id"
        element={
          <RequireRole role="TEACHER">
            <TeacherExamPage />
          </RequireRole>
        }
      />

      <Route
        path="/student"
        element={
          <RequireRole role="STUDENT">
            <StudentHome />
          </RequireRole>
        }
      />

      <Route
        path="/"
        element={user ? <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student"} replace /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}