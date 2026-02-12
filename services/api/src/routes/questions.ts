import { Router } from "express";
import { QuestionModel } from "../models/question";
import { createQuestionSchema, listQuestionsQuerySchema } from "../schemas/question.schema";

export const questionsRouter = Router();

questionsRouter.post("/", async (req, res) => {
  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const created = await QuestionModel.create(parsed.data);
  return res.status(201).json(created);
});

questionsRouter.get("/", async (req, res) => {
  const parsed = listQuestionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { limit = 20, skip = 0, ...filters } = parsed.data;

  const items = await QuestionModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await QuestionModel.countDocuments(filters);

  return res.json({ total, items });
});
