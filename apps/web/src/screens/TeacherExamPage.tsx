import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { deleteExam, renderExam, type ExamVersion, type RenderExamResponse } from "../lib/api";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function buildPdfText(rendered: RenderExamResponse) {
  const lines: string[] = [];
  lines.push(`${rendered.exam.title} (Versão ${rendered.exam.version})`);
  lines.push(`${rendered.exam.subject} | ${rendered.exam.grade}`);
  lines.push(`Tópicos: ${rendered.exam.topics.join(", ")}`);
  lines.push("");
  rendered.questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.statement}`);
    if (q.type === "MCQ") {
      q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isCorrect = "answerKey" in q && typeof q.answerKey === "number" && q.answerKey === idx;
        lines.push(`   ${letter}) ${opt}${isCorrect ? " (correta)" : ""}`);
      });
    } else {
      if ("expectedAnswer" in q && q.expectedAnswer) lines.push(`   Resposta esperada: ${q.expectedAnswer}`);
      if ("rubric" in q && q.rubric) lines.push(`   Rubrica: ${q.rubric}`);
      lines.push("   ________________________________");
    }
    lines.push("");
  });
  return lines.join("\n");
}

export default function TeacherExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState<ExamVersion>("A");
  const [rendered, setRendered] = useState<RenderExamResponse | null>(null);

  const examId = (id ?? "").trim();

  async function load(v: ExamVersion) {
    if (!token || !examId) return;
    setError("");
    setLoading(true);
    try {
      const data = await renderExam({ token, examId, version: v, audience: "teacher" });
      setRendered(data);
    } catch (e) {
      setRendered(null);
      setError(msg(e, "RENDER_FAILED"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(version);
  }, [token, examId, version]);

  async function onDelete() {
    if (!token || !examId) return;
    setError("");
    try {
      await deleteExam({ token, examId });
      navigate("/teacher");
    } catch (e) {
      setError(msg(e, "DELETE_FAILED"));
    }
  }

  async function onExportPdf() {
    if (!rendered) return;
    setError("");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const text = buildPdfText(rendered);
      const marginX = 40;
      const maxWidth = 515;
      const lines = doc.splitTextToSize(text, maxWidth);

      let y = 48;
      const lineHeight = 14;

      for (const line of lines) {
        if (y > 780) {
          doc.addPage();
          y = 48;
        }
        doc.text(line, marginX, y);
        y += lineHeight;
      }

      doc.save(`${rendered.exam.title}-versao-${rendered.exam.version}.pdf`);
    } catch (e) {
      setError(msg(e, "PDF_EXPORT_FAILED"));
    }
  }

  const header = useMemo(() => {
    if (!rendered) return null;
    return (
      <div>
        <div className="exam-title">
          {rendered.exam.title} (Versão {rendered.exam.version})
        </div>
        <div className="exam-sub">
          {rendered.exam.subject} | {rendered.exam.grade} | {rendered.exam.topics.join(", ")}
        </div>
        <div className="exam-id" style={{ marginTop: 6 }}>
          <span className="kbd">{examId}</span>
        </div>
      </div>
    );
  }, [rendered, examId]);

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <h1>Prova</h1>
          <div className="subtitle">Visualização completa, A/B, exportação e exclusão</div>
        </div>

        <div className="userbar">
          <button className="btn btn-ghost" onClick={() => navigate("/teacher")}>
            Voltar
          </button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Controles</h2>
          <div className="card-meta">{loading ? "Carregando..." : "Pronto"}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className={version === "A" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setVersion("A")}>
            Versão A
          </button>

          <button className={version === "B" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setVersion("B")}>
            Versão B
          </button>

          <button className="btn btn-ghost" onClick={() => load(version)} disabled={loading}>
            Recarregar
          </button>

          <button className="btn btn-primary" onClick={onExportPdf} disabled={!rendered}>
            Exportar PDF
          </button>

          <button className="btn btn-danger" onClick={onDelete} disabled={!examId}>
            Deletar prova
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2 className="card-title">Visualização</h2>
          <div className="card-meta">Leitura fácil</div>
        </div>

        {header}

        {rendered ? (
          <ol style={{ marginTop: 14, paddingLeft: 18 }}>
            {rendered.questions.map((q) => (
              <li key={q.id} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.25 }}>{q.statement}</div>

                {q.type === "MCQ" ? (
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {q.options.map((opt, idx) => {
                      const isCorrect = "answerKey" in q && typeof q.answerKey === "number" && q.answerKey === idx;
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(215,225,238,0.95)",
                            background: isCorrect ? "rgba(0,173,104,0.10)" : "rgba(255,255,255,0.88)"
                          }}
                        >
                          <strong style={{ marginRight: 10 }}>{String.fromCharCode(65 + idx)})</strong>
                          {opt}
                          {isCorrect ? <strong style={{ marginLeft: 8 }}>correta</strong> : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    {"expectedAnswer" in q && q.expectedAnswer ? (
                      <div>
                        <strong>Resposta esperada:</strong> {q.expectedAnswer}
                      </div>
                    ) : null}
                    {"rubric" in q && q.rubric ? (
                      <div style={{ marginTop: 6 }}>
                        <strong>Rubrica:</strong> {q.rubric}
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <div className="card-meta">Nada para mostrar.</div>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2 className="card-title">Edição de prova</h2>
          <div className="card-meta">Próximo passo: substituir questões mantendo A/B</div>
        </div>

        <div className="card-meta">
          Para editar do jeito certo, eu vou te entregar dois endpoints:
          <span className="kbd" style={{ marginLeft: 8 }}>GET /exams/:id</span>
          <span className="kbd" style={{ marginLeft: 8 }}>PATCH /exams/:id/replace</span>
          e um modal no front para escolher a nova questão.
        </div>
      </section>
    </div>
  );
}