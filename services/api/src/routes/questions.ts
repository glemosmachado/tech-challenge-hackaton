import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import QuestionModel from "../models/question.js";

const router = Router();

type Subject = "physics" | "geography";
type Difficulty = "easy" | "medium" | "hard";
type QuestionType = "MCQ" | "DISC";

type QuestionDoc = {
  _id: unknown;
  teacherId: string;
  subject: Subject;
  grade: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  statement: string;
  options?: string[];
  correctIndex?: number;
  expectedAnswer?: string;
  rubric?: string;
  save: () => Promise<QuestionDoc>;
};

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function normalizeString(x: unknown) {
  return isNonEmptyString(x) ? x.trim() : "";
}

function isSubject(x: string): x is Subject {
  return x === "physics" || x === "geography";
}

function isDifficulty(x: string): x is Difficulty {
  return x === "easy" || x === "medium" || x === "hard";
}

function isQuestionType(x: string): x is QuestionType {
  return x === "MCQ" || x === "DISC";
}

function pickTeacherId(req: any, bodyTeacherId: unknown): string {
  if (isNonEmptyString(bodyTeacherId)) return bodyTeacherId.trim();
  const sub = req?.user?.sub;
  if (isNonEmptyString(sub)) return sub.trim();
  const id = req?.user?.id;
  if (isNonEmptyString(id)) return id.trim();
  return "";
}

function validateMCQ(options: unknown, correctIndex: unknown) {
  if (!Array.isArray(options)) return { ok: false, error: "MCQ_OPTIONS_REQUIRED" as const };
  const cleaned = options.map((o) => (typeof o === "string" ? o.trim() : "")).filter(Boolean);
  if (cleaned.length < 2) return { ok: false, error: "MCQ_OPTIONS_MIN_2" as const };
  const idx = Number(correctIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= cleaned.length) return { ok: false, error: "MCQ_CORRECT_INDEX_INVALID" as const };
  return { ok: true, options: cleaned, correctIndex: idx } as const;
}

router.get("/topics", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = pickTeacherId(req, undefined);
  const subjectRaw = normalizeString(req.query.subject);
  const grade = normalizeString(req.query.grade);

  if (!teacherId) return res.status(401).json({ error: "UNAUTHORIZED" });
  if (!subjectRaw || !grade) return res.status(400).json({ error: "MISSING_QUERY", required: ["subject", "grade"] });
  if (!isSubject(subjectRaw)) return res.status(400).json({ error: "INVALID_SUBJECT" });

  const topics = await QuestionModel.distinct("topic", { teacherId, subject: subjectRaw, grade });
  return res.json({ topics });
});

router.get("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = pickTeacherId(req, undefined);
  if (!teacherId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const subjectRaw = normalizeString(req.query.subject);
  const grade = normalizeString(req.query.grade);
  const topic = normalizeString(req.query.topic);
  const typeRaw = normalizeString(req.query.type);
  const difficultyRaw = normalizeString(req.query.difficulty);

  const query: Record<string, unknown> = { teacherId };
  if (subjectRaw && isSubject(subjectRaw)) query.subject = subjectRaw;
  if (grade) query.grade = grade;
  if (topic) query.topic = topic;
  if (typeRaw && isQuestionType(typeRaw)) query.type = typeRaw;
  if (difficultyRaw && isDifficulty(difficultyRaw)) query.difficulty = difficultyRaw;

  const docs = await QuestionModel.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ questions: docs });
});

router.get("/:id", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = pickTeacherId(req, undefined);
  if (!teacherId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const doc = await QuestionModel.findOne({ _id: req.params.id, teacherId }).lean();
  if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

  return res.json({ question: doc });
});

router.post("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = pickTeacherId(req, req.body?.teacherId);
  if (!teacherId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const subjectRaw = normalizeString(req.body?.subject);
  const grade = normalizeString(req.body?.grade);
  const topic = normalizeString(req.body?.topic);
  const difficultyRaw = normalizeString(req.body?.difficulty);
  const typeRaw = normalizeString(req.body?.type);
  const statement = normalizeString(req.body?.statement);

  if (!subjectRaw || !grade || !topic || !difficultyRaw || !typeRaw || !statement) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      required: ["subject", "grade", "topic", "difficulty", "type", "statement"]
    });
  }

  if (!isSubject(subjectRaw)) return res.status(400).json({ error: "INVALID_SUBJECT" });
  if (!isDifficulty(difficultyRaw)) return res.status(400).json({ error: "INVALID_DIFFICULTY" });
  if (!isQuestionType(typeRaw)) return res.status(400).json({ error: "INVALID_TYPE" });

  const subject: Subject = subjectRaw;
  const difficulty: Difficulty = difficultyRaw;
  const type: QuestionType = typeRaw;

  if (type === "MCQ") {
    const v = validateMCQ(req.body?.options, req.body?.correctIndex);
    if (!v.ok) return res.status(400).json({ error: v.error });

    const doc = await QuestionModel.create({
      teacherId,
      subject,
      grade,
      topic,
      difficulty,
      type,
      statement,
      options: v.options,
      correctIndex: v.correctIndex
    });

    return res.status(201).json({ question: doc });
  }

  const expectedAnswer = normalizeString(req.body?.expectedAnswer);
  const rubric = normalizeString(req.body?.rubric);

  const doc = await QuestionModel.create({
    teacherId,
    subject,
    grade,
    topic,
    difficulty,
    type,
    statement,
    expectedAnswer: expectedAnswer || undefined,
    rubric: rubric || undefined
  });

  return res.status(201).json({ question: doc });
});

router.patch("/:id", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = pickTeacherId(req, undefined);
  if (!teacherId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const existing = (await QuestionModel.findOne({ _id: req.params.id, teacherId })) as unknown as QuestionDoc | null;
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });

  const subjectRaw = normalizeString(req.body?.subject);
  const gradeRaw = normalizeString(req.body?.grade);
  const topicRaw = normalizeString(req.body?.topic);
  const difficultyRaw = normalizeString(req.body?.difficulty);
  const typeRaw = normalizeString(req.body?.type);
  const statementRaw = normalizeString(req.body?.statement);

  const subject = subjectRaw ? (isSubject(subjectRaw) ? subjectRaw : null) : existing.subject;
  const grade = gradeRaw || existing.grade;
  const topic = topicRaw || existing.topic;
  const difficulty = difficultyRaw ? (isDifficulty(difficultyRaw) ? difficultyRaw : null) : existing.difficulty;
  const type = typeRaw ? (isQuestionType(typeRaw) ? typeRaw : null) : existing.type;
  const statement = statementRaw || existing.statement;

  if (!subject) return res.status(400).json({ error: "INVALID_SUBJECT" });
  if (!difficulty) return res.status(400).json({ error: "INVALID_DIFFICULTY" });
  if (!type) return res.status(400).json({ error: "INVALID_TYPE" });
  if (!grade || !topic || !statement) return res.status(400).json({ error: "VALIDATION_ERROR" });

  if (type === "MCQ") {
    const optionsSrc = req.body?.options ?? existing.options;
    const correctIndexSrc = req.body?.correctIndex ?? existing.correctIndex;
    const v = validateMCQ(optionsSrc, correctIndexSrc);
    if (!v.ok) return res.status(400).json({ error: v.error });

    existing.subject = subject;
    existing.grade = grade;
    existing.topic = topic;
    existing.difficulty = difficulty;
    existing.type = "MCQ";
    existing.statement = statement;
    existing.options = v.options;
    existing.correctIndex = v.correctIndex;
    existing.expectedAnswer = undefined;
    existing.rubric = undefined;

    await existing.save();
    return res.json({ question: existing });
  }

  const expectedAnswer = normalizeString(req.body?.expectedAnswer);
  const rubric = normalizeString(req.body?.rubric);

  existing.subject = subject;
  existing.grade = grade;
  existing.topic = topic;
  existing.difficulty = difficulty;
  existing.type = "DISC";
  existing.statement = statement;
  existing.options = undefined;
  existing.correctIndex = undefined;
  existing.expectedAnswer = expectedAnswer || undefined;
  existing.rubric = rubric || undefined;

  await existing.save();
  return res.json({ question: existing });
});

router.delete("/:id", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const teacherId = pickTeacherId(req, undefined);
  if (!teacherId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const deleted = await QuestionModel.findOneAndDelete({ _id: req.params.id, teacherId });
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });

  return res.status(204).send();
});

export const questionsRouter = router;
export default router;