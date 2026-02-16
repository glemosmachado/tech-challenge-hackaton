import { Router } from "express";
import { Types } from "mongoose";
import { ExamModel } from "../models/exam";
import { QuestionModel } from "../models/question";
import { createExamSchema } from "../schemas/exam.schema";
import { composeExamSchema } from "../schemas/exam.compose.schema";
import { shuffled, range } from "../utils/shuffle";

export const examsRouter = Router();

function isObjectIdString(value: unknown): value is string {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

type Replacement = { oldQuestionId: string; newQuestionId: string };

function validateReplacements(input: unknown): { replacements: Replacement[]; regenerateOptionsForReplacedMCQ: boolean } | null {
  if (!input || typeof input !== "object") return null;
  const body = input as any;

  const replacements = body.replacements;
  const regenerateOptionsForReplacedMCQ = body.regenerateOptionsForReplacedMCQ !== false;

  if (!Array.isArray(replacements) || replacements.length < 1 || replacements.length > 10) return null;

  const normalized: Replacement[] = [];
  for (const r of replacements) {
    if (!r || typeof r !== "object") return null;
    if (!isObjectIdString(r.oldQuestionId) || !isObjectIdString(r.newQuestionId)) return null;
    normalized.push({ oldQuestionId: r.oldQuestionId, newQuestionId: r.newQuestionId });
  }

  const oldSet = new Set(normalized.map((x) => x.oldQuestionId));
  const newSet = new Set(normalized.map((x) => x.newQuestionId));
  if (oldSet.size !== normalized.length) return null;
  if (newSet.size !== normalized.length) return null;

  return { replacements: normalized, regenerateOptionsForReplacedMCQ };
}

examsRouter.post("/compose", async (req, res) => {
  const parsed = composeExamSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { teacherId, title, subject, grade, topic, qty, difficulty, types } = parsed.data;

  const filter: Record<string, unknown> = { teacherId, subject, grade, topic };
  if (difficulty) filter.difficulty = difficulty;
  if (types?.length) filter.type = { $in: types };

  const pool = await QuestionModel.find(filter).limit(500);
  if (pool.length < qty) {
    return res.status(400).json({
      error: "NOT_ENOUGH_QUESTIONS",
      details: { available: pool.length, requested: qty }
    });
  }

  const selected = shuffled(pool).slice(0, qty);
  const objectIds = selected.map((q) => new Types.ObjectId(String(q._id)));
  const baseOrder = objectIds;

  function buildVersion(version: "A" | "B", avoidOrder?: string[]) {
    let questionOrderStr = shuffled(baseOrder).map(String);

    if (avoidOrder) {
      let tries = 0;
      while (tries < 10 && questionOrderStr.join(",") === avoidOrder.join(",")) {
        questionOrderStr = shuffled(baseOrder).map(String);
        tries++;
      }
    }

    const optionsOrderByQuestion: Record<string, number[]> = {};
    for (const q of selected) {
      if (q.type === "MCQ" && Array.isArray(q.options)) {
        optionsOrderByQuestion[String(q._id)] = shuffled(range(q.options.length));
      }
    }

    return {
      version,
      questionOrder: questionOrderStr.map((id) => new Types.ObjectId(id)),
      optionsOrderByQuestion
    };
  }

  const vA = buildVersion("A");
  const vB = buildVersion("B", vA.questionOrder.map(String));

  const created = await ExamModel.create({
    teacherId,
    title,
    subject,
    grade,
    topic,
    questionIds: baseOrder,
    versions: [vA, vB]
  });

  return res.status(201).json(created);
});

examsRouter.post("/", async (req, res) => {
  const parsed = createExamSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { teacherId, title, subject, grade, topic, questionIds } = parsed.data;

  const objectIds = questionIds.map((id) => new Types.ObjectId(id));
  const questions = await QuestionModel.find({ _id: { $in: objectIds } });

  if (questions.length !== objectIds.length) {
    return res.status(400).json({ error: "INVALID_QUESTION_IDS" });
  }

  const baseOrder = objectIds;

  function buildVersion(version: "A" | "B", avoidOrder?: string[]) {
    let questionOrderStr = shuffled(baseOrder).map(String);

    if (avoidOrder) {
      let tries = 0;
      while (tries < 10 && questionOrderStr.join(",") === avoidOrder.join(",")) {
        questionOrderStr = shuffled(baseOrder).map(String);
        tries++;
      }
    }

    const optionsOrderByQuestion: Record<string, number[]> = {};
    for (const q of questions) {
      if (q.type === "MCQ" && Array.isArray(q.options)) {
        optionsOrderByQuestion[String(q._id)] = shuffled(range(q.options.length));
      }
    }

    return {
      version,
      questionOrder: questionOrderStr.map((id) => new Types.ObjectId(id)),
      optionsOrderByQuestion
    };
  }

  const vA = buildVersion("A");
  const vB = buildVersion("B", vA.questionOrder.map(String));

  const created = await ExamModel.create({
    teacherId,
    title,
    subject,
    grade,
    topic,
    questionIds: baseOrder,
    versions: [vA, vB]
  });

  return res.status(201).json(created);
});

examsRouter.get("/", async (req, res) => {
  const teacherId = req.query.teacherId as string | undefined;
  const filter = teacherId ? { teacherId } : {};
  const items = await ExamModel.find(filter).sort({ createdAt: -1 }).limit(50);
  return res.json({ total: items.length, items });
});

examsRouter.get("/:id", async (req, res) => {
  if (!isObjectIdString(req.params.id)) {
    return res.status(400).json({ error: "INVALID_ID" });
  }

  const exam = await ExamModel.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "NOT_FOUND" });

  return res.json(exam);
});

examsRouter.delete("/:id", async (req, res) => {
  if (!isObjectIdString(req.params.id)) {
    return res.status(400).json({ error: "INVALID_ID" });
  }

  const deleted = await ExamModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });

  return res.status(204).send();
});

examsRouter.post("/:id/replace-questions", async (req, res) => {
  if (!isObjectIdString(req.params.id)) {
    return res.status(400).json({ error: "INVALID_ID" });
  }

  const parsedBody = validateReplacements(req.body);
  if (!parsedBody) {
    return res.status(400).json({ error: "VALIDATION_ERROR" });
  }

  const { replacements, regenerateOptionsForReplacedMCQ } = parsedBody;

  const exam = await ExamModel.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "NOT_FOUND" });

  const oldIds = replacements.map((r) => r.oldQuestionId);
  const newIds = replacements.map((r) => r.newQuestionId);

  const examQuestionIdsSet = new Set(exam.questionIds.map((x) => String(x)));
  for (const oldId of oldIds) {
    if (!examQuestionIdsSet.has(oldId)) {
      return res.status(400).json({ error: "OLD_QUESTION_NOT_IN_EXAM", details: { oldQuestionId: oldId } });
    }
  }

  const newQuestions = await QuestionModel.find({ _id: { $in: newIds.map((id) => new Types.ObjectId(id)) } });
  if (newQuestions.length !== newIds.length) {
    return res.status(400).json({ error: "INVALID_NEW_QUESTION_IDS" });
  }

  for (const q of newQuestions) {
    if (q.teacherId !== exam.teacherId) {
      return res.status(400).json({ error: "NEW_QUESTION_TEACHER_MISMATCH", details: { questionId: String(q._id) } });
    }
    if (q.subject !== exam.subject || q.grade !== exam.grade || q.topic !== exam.topic) {
      return res.status(400).json({ error: "NEW_QUESTION_FILTER_MISMATCH", details: { questionId: String(q._id) } });
    }
  }

  const replacementMap = new Map<string, string>();
  for (const r of replacements) replacementMap.set(r.oldQuestionId, r.newQuestionId);

  const updatedQuestionIds = exam.questionIds.map((qid) => {
    const s = String(qid);
    const replaced = replacementMap.get(s);
    return replaced ? new Types.ObjectId(replaced) : qid;
  });

  const updatedVersions = exam.versions.map((v) => {
    const updatedOrder = v.questionOrder.map((qid) => {
      const s = String(qid);
      const replaced = replacementMap.get(s);
      return replaced ? new Types.ObjectId(replaced) : qid;
    });

    const updatedOptionsMap: Record<string, number[]> = { ...(v.optionsOrderByQuestion as any) };

    for (const r of replacements) {
      delete updatedOptionsMap[r.oldQuestionId];
    }

    if (regenerateOptionsForReplacedMCQ) {
      const newById = new Map(newQuestions.map((q) => [String(q._id), q]));
      for (const r of replacements) {
        const nq = newById.get(r.newQuestionId);
        if (nq && nq.type === "MCQ" && Array.isArray(nq.options)) {
          updatedOptionsMap[r.newQuestionId] = shuffled(range(nq.options.length));
        }
      }
    }

    return {
      version: v.version,
      questionOrder: updatedOrder,
      optionsOrderByQuestion: updatedOptionsMap
    };
  });

  exam.questionIds = updatedQuestionIds;
  exam.versions = updatedVersions as any;

  const saved = await exam.save();
  return res.json(saved);
});

examsRouter.get("/:id/render", async (req, res) => {
  const version = (req.query.version as string) ?? "A";
  if (version !== "A" && version !== "B") {
    return res.status(400).json({ error: "INVALID_VERSION" });
  }

  if (!isObjectIdString(req.params.id)) {
    return res.status(400).json({ error: "INVALID_ID" });
  }

  const exam = await ExamModel.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "NOT_FOUND" });

  const v = exam.versions.find((x) => x.version === version);
  if (!v) return res.status(404).json({ error: "VERSION_NOT_FOUND" });

  const questions = await QuestionModel.find({ _id: { $in: exam.questionIds } });
  const map = new Map(questions.map((q) => [String(q._id), q]));

  const renderedQuestions = v.questionOrder
    .map((qid) => {
      const q = map.get(String(qid));
      if (!q) return null;

      if (q.type === "MCQ" && Array.isArray(q.options)) {
        const order = (v.optionsOrderByQuestion as any)[String(q._id)] ?? range(q.options.length);
        const options = order.map((idx: number) => q.options![idx]);

        const correctIndex =
          typeof q.correctIndex === "number" ? order.indexOf(q.correctIndex) : undefined;

        return {
          id: String(q._id),
          type: q.type,
          statement: q.statement,
          options,
          answerKey: typeof correctIndex === "number" ? correctIndex : null
        };
      }

      if (q.type === "DISC") {
        return {
          id: String(q._id),
          type: q.type,
          statement: q.statement,
          expectedAnswer: q.expectedAnswer ?? null,
          rubric: q.rubric ?? null
        };
      }

      return null;
    })
    .filter(Boolean);

  return res.json({
    exam: {
      id: String(exam._id),
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      topic: exam.topic,
      version
    },
    questions: renderedQuestions
  });
});