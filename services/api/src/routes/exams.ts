import { Router } from "express";
import Exam from "../models/exam.js";
import Question from "../models/question.js";
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

function buildVersion(questionDocs: any[], version: "A" | "B") {
  const questionOrder = shuffle(questionDocs.map((q) => String(q._id)));

  const optionsOrderByQuestion: Record<string, number[]> = {};
  for (const q of questionDocs) {
    if (q.type === "MCQ" && Array.isArray(q.options)) {
      optionsOrderByQuestion[String(q._id)] = shuffle(q.options.map((_: any, idx: number) => idx));
    }
  }

  return { version, questionOrder, optionsOrderByQuestion };
}

router.get("/", requireAuth, requireRole("TEACHER"), async (_req, res) => {
  const items = await Exam.find({}).sort({ createdAt: -1 }).limit(200);
  const total = await Exam.countDocuments({});
  return res.json({ total, items });
});

router.delete("/:id", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const id = String(req.params.id);
  const deleted = await Exam.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "not found" });
  return res.status(204).send();
});

router.post("/compose", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const title = String(req.body?.title ?? "").trim();
  const subject = String(req.body?.subject ?? "").trim();
  const grade = String(req.body?.grade ?? "").trim();
  const qty = Number(req.body?.qty ?? 0);

  const topicsFromArray = Array.isArray(req.body?.topics) ? req.body.topics : null;
  const topicSingle = String(req.body?.topic ?? "").trim();

  const topics = topicsFromArray
    ? topicsFromArray.map((t: any) => String(t).trim()).filter((t: string) => t.length > 0)
    : topicSingle
      ? [topicSingle]
      : [];

  const types = Array.isArray(req.body?.types)
    ? req.body.types.map((t: any) => String(t).trim()).filter((t: string) => t.length > 0)
    : ["MCQ", "DISC"];

  const difficulty = req.body?.difficulty ? String(req.body.difficulty).trim() : undefined;

  if (!title || !subject || !grade) {
    return res.status(400).json({ message: "title, subject and grade are required" });
  }

  if (!Number.isFinite(qty) || qty <= 0 || qty > 50) {
    return res.status(400).json({ message: "qty must be between 1 and 50" });
  }

  if (topics.length === 0) {
    return res.status(400).json({ message: "topics is required (select at least 1 topic)" });
  }

  const match: Record<string, any> = {
    subject,
    grade,
    topic: { $in: topics },
    type: { $in: types }
  };

  if (difficulty) match.difficulty = difficulty;

  const availableCount = await Question.countDocuments(match);
  if (availableCount < qty) {
    return res.status(400).json({
      message: "not enough questions for selected filters",
      available: availableCount,
      requested: qty,
      filters: { subject, grade, topics, types, difficulty: difficulty ?? null }
    });
  }

  const selected = await Question.aggregate([{ $match: match }, { $sample: { size: qty } }]);

  const questionIds = selected.map((q: any) => String(q._id));
  const versions = [buildVersion(selected, "A"), buildVersion(selected, "B")];

  const teacherId = req.user?.sub ?? "unknown-teacher";

  const doc = await Exam.create({
    teacherId,
    title,
    subject,
    grade,
    topic: topics.join(","),
    questionIds,
    versions
  });

  return res.status(201).json(doc);
});

router.get("/:id/render", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const version = String(req.query.version ?? "A") === "B" ? "B" : "A";
  const mode = String(req.query.mode ?? "student") === "teacher" ? "teacher" : "student";

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "not found" });

  const v = (exam.versions ?? []).find((x: any) => x.version === version);
  if (!v) return res.status(400).json({ message: "invalid version" });

  const questionDocs = await Question.find({ _id: { $in: v.questionOrder } });
  const byId = new Map(questionDocs.map((q: any) => [String(q._id), q]));

  const questions = v.questionOrder
    .map((qid: string) => {
      const q = byId.get(String(qid));
      if (!q) return null;

      if (q.type === "MCQ") {
        const order = v.optionsOrderByQuestion?.[String(q._id)] ?? q.options.map((_: any, idx: number) => idx);
        const options = order.map((idx: number) => q.options[idx]);

        const answerKey =
          mode === "teacher"
            ? order.findIndex((idx: number) => idx === q.correctIndex)
            : undefined;

        return {
          id: String(q._id),
          type: "MCQ",
          statement: q.statement,
          options,
          ...(mode === "teacher" ? { answerKey } : {})
        };
      }

      return {
        id: String(q._id),
        type: "DISC",
        statement: q.statement,
        ...(mode === "teacher" ? { expectedAnswer: q.expectedAnswer ?? null, rubric: q.rubric ?? null } : {})
      };
    })
    .filter(Boolean);

  return res.json({
    exam: {
      id: String(exam._id),
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      topic: exam.topic,
      version,
      mode
    },
    questions
  });
});

export default router;