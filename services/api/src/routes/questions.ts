import { Router } from "express";
import Question from "../models/question.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/topics", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const subject = (req.query.subject as string | undefined)?.trim() ?? "";
  const grade = (req.query.grade as string | undefined)?.trim() ?? "";

  if (!subject || !grade) {
    return res.status(400).json({ message: "subject and grade are required" });
  }

  const topics = await Question.distinct("topic", {
    subject,
    grade,
    topic: { $ne: "" }
  });

  const items = topics
    .map((t) => String(t))
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .sort((a, b) => a.localeCompare(b));

  return res.json({ items });
});

router.get("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const subject = (req.query.subject as string | undefined)?.trim() ?? "";
  const grade = (req.query.grade as string | undefined)?.trim() ?? "";
  const topic = (req.query.topic as string | undefined)?.trim() ?? "";
  const difficulty = (req.query.difficulty as string | undefined)?.trim() ?? "";
  const type = (req.query.type as string | undefined)?.trim() ?? "";

  const filter: Record<string, unknown> = {};
  if (subject) filter.subject = subject;
  if (grade) filter.grade = grade;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;

  const items = await Question.find(filter).sort({ createdAt: -1 }).limit(500);
  const total = await Question.countDocuments(filter);

  return res.json({ total, items });
});

router.post("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const {
    teacherId,
    subject,
    grade,
    topic,
    difficulty,
    type,
    statement,
    options,
    correctIndex,
    expectedAnswer,
    rubric
  } = req.body ?? {};

  if (!subject || !grade || !topic || !difficulty || !type || !statement) {
    return res.status(400).json({ message: "missing required fields" });
  }

  if (type === "MCQ") {
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "MCQ options must be an array with at least 2 items" });
    }
    if (typeof correctIndex !== "number" || correctIndex < 0 || correctIndex >= options.length) {
      return res.status(400).json({ message: "MCQ correctIndex is invalid" });
    }
  }

  if (type === "DISC") {
    if (typeof expectedAnswer !== "string" || expectedAnswer.trim().length === 0) {
      return res.status(400).json({ message: "DISC expectedAnswer is required" });
    }
  }

  const doc = await Question.create({
    teacherId: teacherId ?? "demo-teacher",
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

export default router;