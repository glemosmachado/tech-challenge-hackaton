import { Router } from "express";
import QuestionModel from "../models/question.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/topics", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const subject = (req.query.subject as string | undefined)?.trim() ?? "";
  const grade = (req.query.grade as string | undefined)?.trim() ?? "";

  if (!subject || !grade) {
    return res.status(400).json({ error: "MISSING_QUERY", required: ["subject", "grade"] });
  }

  const topics = await QuestionModel.distinct("topic", { subject, grade });
  const sorted = topics
    .filter((t) => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return res.json({ topics: sorted });
});

router.get("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const subject = (req.query.subject as string | undefined)?.trim();
  const grade = (req.query.grade as string | undefined)?.trim();
  const topic = (req.query.topic as string | undefined)?.trim();

  const query: Record<string, unknown> = {};
  if (subject) query.subject = subject;
  if (grade) query.grade = grade;
  if (topic) query.topic = topic;

  const docs = await QuestionModel.find(query).sort({ createdAt: -1 }).lean();

  return res.json({ questions: docs });
});

router.post("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const { teacherId, subject, grade, topic, difficulty, type, statement, options, correctIndex, expectedAnswer, rubric } =
    req.body ?? {};

  if (!teacherId || !subject || !grade || !topic || !difficulty || !type || !statement) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      required: ["teacherId", "subject", "grade", "topic", "difficulty", "type", "statement"]
    });
  }

  const doc = await QuestionModel.create({
    teacherId,
    subject,
    grade,
    topic,
    difficulty,
    type,
    statement,
    options: type === "MCQ" ? options : undefined,
    correctIndex: type === "MCQ" ? correctIndex : undefined,
    expectedAnswer: type === "DISC" ? expectedAnswer : undefined,
    rubric: type === "DISC" ? rubric : undefined
  });

  return res.status(201).json(doc);
});

export const questionsRouter = router;
export default router;