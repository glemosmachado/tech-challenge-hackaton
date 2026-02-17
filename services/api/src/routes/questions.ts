import { Router } from "express";
import { QuestionModel } from "../models/question";
import { createQuestionSchema, listQuestionsQuerySchema } from "../schemas/question.schema";
import { requireAuth, requireRole } from "../middlewares/auth";

export const questionsRouter = Router();

questionsRouter.post("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const body = parsed.data;

  if (req.user?.role === "TEACHER" && req.user.sub) {
    body.teacherId = req.user.sub;
  }

  try {
    const created = await QuestionModel.create(body);
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "DUPLICATE_QUESTION" });
    }
    throw err;
  }
});

questionsRouter.get("/", requireAuth, async (req, res) => {
  const parsed = listQuestionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { limit = 20, skip = 0, ...filters } = parsed.data;

  const effectiveFilters: Record<string, unknown> = { ...filters };

  if (req.user?.role === "TEACHER") {
    effectiveFilters.teacherId = req.user.sub;
  }

  const items = await QuestionModel.find(effectiveFilters).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await QuestionModel.countDocuments(effectiveFilters);

  return res.json({ total, items });
});