import { Router } from "express";
import { Types } from "mongoose";
import { ExamModel } from "../models/exam";
import { QuestionModel } from "../models/question";
import { createExamSchema } from "../schemas/exam.schema";
import { composeExamSchema } from "../schemas/exam.compose.schema";
import { shuffled, range } from "../utils/shuffle";

export const examsRouter = Router();

examsRouter.post("/compose", async (req, res) => {
  const parsed = composeExamSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { teacherId, title, subject, grade, topic, qty, difficulty, types } =
    parsed.data;

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
      while (
        tries < 10 &&
        questionOrderStr.join(",") === avoidOrder.join(",")
      ) {
        questionOrderStr = shuffled(baseOrder).map(String);
        tries++;
      }
    }

    const optionsOrderByQuestion: Record<string, number[]> = {};
    for (const q of selected) {
      if (q.type === "MCQ" && Array.isArray(q.options)) {
        optionsOrderByQuestion[String(q._id)] = shuffled(
          range(q.options.length)
        );
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
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
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
      while (
        tries < 10 &&
        questionOrderStr.join(",") === avoidOrder.join(",")
      ) {
        questionOrderStr = shuffled(baseOrder).map(String);
        tries++;
      }
    }

    const optionsOrderByQuestion: Record<string, number[]> = {};
    for (const q of questions) {
      if (q.type === "MCQ" && Array.isArray(q.options)) {
        optionsOrderByQuestion[String(q._id)] = shuffled(
          range(q.options.length)
        );
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

examsRouter.get("/:id/render", async (req, res) => {
  const version = (req.query.version as string) ?? "A";
  if (version !== "A" && version !== "B") {
    return res.status(400).json({ error: "INVALID_VERSION" });
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
        const order =
          v.optionsOrderByQuestion[String(q._id)] ?? range(q.options.length);

        const options = order.map((idx) => q.options![idx]);

        const correctIndex =
          typeof q.correctIndex === "number"
            ? order.indexOf(q.correctIndex)
            : undefined;

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
          answerKey: q.expectedAnswer ?? null,
          rubric: q.rubric ?? null
        };
      }

      return {
        id: String(q._id),
        type: q.type,
        statement: q.statement,
        answerKey: null
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
      version
    },
    questions: renderedQuestions
  });
});