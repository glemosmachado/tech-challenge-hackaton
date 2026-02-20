import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { deleteExam, renderExam, type ExamVersion, type RenderExamResponse } from "../lib/api";

function msg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function safe(s: string) {
  return (s ?? "").toString();
}

function fmtSubject(s: string) {
  if (s === "physics") return "Física";
  if (s === "geography") return "Geografia";
  return s;
}

function fmtGrade(s: string) {
  return s;
}

function letter(idx: number) {
  return String.fromCharCode(65 + idx);
}

function normalizeTitleFilename(title: string) {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

async function loadImageAsDataUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("LOGO_LOAD_FAILED");
  const blob = await res.blob();
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("LOGO_READ_FAILED"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

type PdfMode = "student" | "teacher";

async function exportPdf(rendered: RenderExamResponse, mode: PdfMode) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const marginX = 44;
  const marginTop = 50;
  const marginBottom = 54;

  const contentW = pageW - marginX * 2;

  const headerH = 92;
  const footerH = 26;

  let y = marginTop;

  const includeAnswerKey = mode === "teacher";

  const schoolName = "Colégio Estadual Shirlei Gomes Santos";
  const portalName = includeAnswerKey ? "Prova (Professor)" : "Prova (Aluno)";

  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImageAsDataUrl("/android-chrome-192x192.png");
  } catch {
    logoDataUrl = null;
  }

  function ensureSpace(required: number) {
    if (y + required > pageH - marginBottom - footerH) {
      doc.addPage();
      y = marginTop;
      drawHeader();
    }
  }

  function drawHeader() {
    const x = marginX;
    const top = marginTop;

    doc.setDrawColor(210, 220, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX, top - 8, contentW, headerH, 14, 14, "FD");

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", x + 14, top + 10, 40, 40);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(schoolName, x + (logoDataUrl ? 62 : 16), top + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(60);
    doc.text(portalName, x + (logoDataUrl ? 62 : 16), top + 42);

    doc.setTextColor(0);

    const rightX = marginX + contentW - 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    const meta1 = `${fmtSubject(rendered.exam.subject)} | ${fmtGrade(rendered.exam.grade)} | Versão ${rendered.exam.version}`;
    const meta2 = `Tópicos: ${rendered.exam.topics.join(", ")}`;

    doc.text(meta1, rightX, top + 24, { align: "right" });
    doc.text(meta2, rightX, top + 42, { align: "right" });

    const title = safe(rendered.exam.title);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const tLines: string[] = doc.splitTextToSize(title, contentW - 28);
    doc.text(tLines, x + 14, top + 70);

    y = top + headerH + 14;
  }

  function drawFooter() {
    const pageCount = doc.getNumberOfPages();
    const current = doc.getCurrentPageInfo().pageNumber;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(`Página ${current} de ${pageCount}`, pageW - marginX, pageH - marginBottom + 18, { align: "right" });
    doc.setTextColor(0);
  }

  function writeParagraph(text: string, opts?: { bold?: boolean; size?: number; extraGap?: number }) {
    const size = opts?.size ?? 11.5;
    const extraGap = opts?.extraGap ?? 6;

    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);

    const lines: string[] = doc.splitTextToSize(text, contentW);
    const lineH = Math.max(12, Math.round(size + 3));

    ensureSpace(lines.length * lineH + extraGap);
    for (const line of lines) {
      doc.text(line, marginX, y);
      y += lineH;
    }
    y += extraGap;
  }

  function writeOptions(options: string[], correctIndex?: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const gap = 6;
    const lineH = 14;

    for (let i = 0; i < options.length; i++) {
      const prefix = `${letter(i)}) `;
      const text = safe(options[i]);

      const maxW = contentW - 18;
      const lines: string[] = doc.splitTextToSize(prefix + text, maxW);

      const needed = lines.length * lineH + gap;
      ensureSpace(needed);

      const isCorrect = typeof correctIndex === "number" && correctIndex === i;

      if (includeAnswerKey && isCorrect) {
        doc.setFillColor(230, 250, 238);
        doc.setDrawColor(205, 235, 215);
        doc.roundedRect(marginX - 4, y - 10, contentW + 8, needed + 2, 10, 10, "FD");
      }

      for (const line of lines) {
        doc.text(line, marginX + 10, y);
        y += lineH;
      }

      y += gap;
    }
    y += 4;
  }

  function writeAnswerArea(linesCount: number) {
    const lineGap = 18;
    const blockH = linesCount * lineGap + 6;

    ensureSpace(blockH);

    doc.setDrawColor(190);
    for (let i = 0; i < linesCount; i++) {
      const yy = y + i * lineGap;
      doc.line(marginX, yy, marginX + contentW, yy);
    }
    y += blockH;
    y += 10;
  }

  drawHeader();

  const infoLine = includeAnswerKey
    ? "PDF com gabarito para conferência do professor."
    : "PDF sem gabarito para aplicação aos alunos.";
  writeParagraph(infoLine, { size: 10.5, extraGap: 10 });

  rendered.questions.forEach((q, idx) => {
    const n = idx + 1;
    const statement = safe(q.statement).trim();

    writeParagraph(`${n}. ${statement}`, { bold: true, size: 12.5, extraGap: 6 });

    if (q.type === "MCQ") {
      const correct = "answerKey" in q && typeof q.answerKey === "number" ? q.answerKey : undefined;
      writeOptions(q.options, correct);

      if (includeAnswerKey && typeof correct === "number") {
        writeParagraph(`Gabarito: ${letter(correct)}`, { size: 10.5, extraGap: 10 });
      } else {
        y += 6;
      }
    } else {
      if (includeAnswerKey) {
        if ("expectedAnswer" in q && q.expectedAnswer) {
          writeParagraph(`Resposta esperada: ${safe(q.expectedAnswer)}`, { size: 10.5, extraGap: 6 });
        }
        if ("rubric" in q && q.rubric) {
          writeParagraph(`Critérios de correção: ${safe(q.rubric)}`, { size: 10.5, extraGap: 10 });
        } else {
          y += 8;
        }
      } else {
        writeAnswerArea(5);
      }
    }

    ensureSpace(20);
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageInfo = doc.getCurrentPageInfo();
    if (pageInfo.pageNumber === p) drawFooter();
  }

  const base = normalizeTitleFilename(rendered.exam.title || "prova");
  const suffix = includeAnswerKey ? "professor" : "aluno";
  doc.save(`${base}-versao-${rendered.exam.version}-${suffix}.pdf`);
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

  async function onExportPdf(mode: PdfMode) {
    if (!rendered) return;
    setError("");
    try {
      await exportPdf(rendered, mode);
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

          <button className="btn btn-primary" onClick={() => onExportPdf("student")} disabled={!rendered}>
            Exportar PDF (aluno)
          </button>

          <button className="btn btn-ghost" onClick={() => onExportPdf("teacher")} disabled={!rendered}>
            Exportar PDF (professor)
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