import { Router } from "express";
import ExamModel from "../models/exam.js";
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

router.post("/compose", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const { teacherId, title, subject, grade, topics, count, mode } = req.body ?? {};

  if (!teacherId || !title || !subject || !grade || !Array.isArray(topics) || topics.length === 0 || !count) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      required: ["teacherId", "title", "subject", "grade", "topics[]", "count"]
    });
  }

  const q = await QuestionModel.find({
    teacherId,
    subject,
    grade,
    topic: { $in: topics }
  });

  if (!q.length) return res.status(404).json({ error: "NO_QUESTIONS_FOUND" });

  const selected = shuffle(q).slice(0, Number(count));

  const exam = await ExamModel.create({
    teacherId,
    title,
    subject,
    grade,
    topic: topics.join(", "),
    questionIds: selected.map((x) => x._id),
    mode: mode ?? "MIXED"
  });

  return res.status(201).json({
    exam,
    questions: selected
  });
});

router.get("/:id", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const exam = await ExamModel.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "NOT_FOUND" });

  const questions = await QuestionModel.find({ _id: { $in: exam.questionIds } }).lean();

  return res.json({ exam, questions });
});

export const examsRouter = router;
export default router;