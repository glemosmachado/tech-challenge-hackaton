import { Router } from "express";
import ExamModel, { type ExamVersion } from "../models/exam.js";
import QuestionModel from "../models/question.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

router.post("/compose", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const { teacherId, title, subject, grade, topics, count, mode } = req.body ?? {};

  if (
    !isNonEmptyString(teacherId) ||
    !isNonEmptyString(title) ||
    !isNonEmptyString(subject) ||
    !isNonEmptyString(grade) ||
    !Array.isArray(topics) ||
    topics.length === 0 ||
    !topics.every(isNonEmptyString) ||
    !Number.isFinite(Number(count)) ||
    Number(count) <= 0
  ) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      required: ["teacherId", "title", "subject", "grade", "topics[]", "count"]
    });
  }

  const qFilter: Record<string, unknown> = {
    teacherId,
    subject,
    grade,
    topic: { $in: topics }
  };

  if (mode === "MCQ") qFilter.type = "MCQ";
  if (mode === "DISC") qFilter.type = "DISC";

  const all = await QuestionModel.find(qFilter).lean();

  if (!all.length) return res.status(404).json({ error: "NO_QUESTIONS_FOUND" });
  const requested = Number(count);
  if (all.length < requested) {
    return res.status(400).json({ error: "INSUFFICIENT_QUESTIONS", available: all.length, requested });
  }

  const selected = shuffle(all).slice(0, requested);

  const ids = selected.map((x) => x._id);
  const versionA = shuffle(ids);
  const versionB = shuffle(ids);

  const exam = await ExamModel.create({
    teacherId,
    title,
    subject,
    grade,
    topics,
    questionIds: ids,
    versions: [
      { version: "A", questionOrder: versionA },
      { version: "B", questionOrder: versionB }
    ],
    mode: mode ?? "MIXED"
  });

  return res.status(201).json({ exam, questions: selected });
});

router.get("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = (req.query.teacherId as string | undefined)?.trim() ?? "";
  if (!teacherId) return res.status(400).json({ error: "MISSING_QUERY", required: ["teacherId"] });

  const exams = await ExamModel.find({ teacherId }).sort({ createdAt: -1 }).lean();
  return res.json({ exams });
});

router.delete("/:id", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = req.user?.sub;
  const id = req.params.id;

  const deleted = await ExamModel.findOneAndDelete({ _id: id, teacherId });
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });

  return res.status(204).send();
});

router.get("/:id/render", requireAuth, async (req, res) => {
  const id = req.params.id;
  const versionRaw = (req.query.version as string | undefined)?.toUpperCase() ?? "A";
  const version = versionRaw as ExamVersion;
  const audience = (req.query.audience as string | undefined) ?? "student";

  if (version !== "A" && version !== "B") {
    return res.status(400).json({ error: "VALIDATION_ERROR", required: ["version=A|B"] });
  }

  const exam = await ExamModel.findById(id).lean();
  if (!exam) return res.status(404).json({ error: "NOT_FOUND" });

  const config = (exam.versions ?? []).find((v) => v.version === version);
  const order = config?.questionOrder?.length ? config.questionOrder : exam.questionIds;

  const qDocs = await QuestionModel.find({ _id: { $in: order } }).lean();
  const byId = new Map<string, any>();
  for (const q of qDocs as any[]) byId.set(String(q._id), q);

  const ordered = order.map((oid) => byId.get(String(oid))).filter(Boolean);

  const isTeacher = audience === "teacher";
  const questions = ordered.map((q: any) => {
    const base = {
      id: String(q._id),
      type: q.type,
      statement: q.statement,
      topic: q.topic,
      difficulty: q.difficulty
    };

    if (q.type === "MCQ") {
      const options = Array.isArray(q.options) ? q.options : [];
      const answerKey = typeof q.correctIndex === "number" ? q.correctIndex : undefined;
      return isTeacher ? { ...base, options, answerKey } : { ...base, options };
    }

    return isTeacher
      ? { ...base, expectedAnswer: q.expectedAnswer ?? "", rubric: q.rubric ?? "" }
      : base;
  });

  return res.json({
    exam: {
      id: String(exam._id),
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      topics: exam.topics,
      version
    },
    questions
  });
});

export const examsRouter = router;
export default router;