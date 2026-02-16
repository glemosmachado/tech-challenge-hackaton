import { z } from "zod";

const base = z.object({
  teacherId: z.string().min(1),
  subject: z.enum(["physics", "geography"]),
  grade: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["MCQ", "DISC"]),
  statement: z.string().min(1)
});

const mcq = base.extend({
  type: z.literal("MCQ"),
  options: z.array(z.string().min(1)).min(4).max(5),
  correctIndex: z.number().int().min(0).max(4)
});

const disc = base.extend({
  type: z.literal("DISC"),
  expectedAnswer: z.string().min(10),
  rubric: z.string().min(1).optional()
});

export const createQuestionSchema = z.discriminatedUnion("type", [mcq, disc]);

export const listQuestionsQuerySchema = z.object({
  teacherId: z.string().min(1).optional(),
  subject: z.enum(["physics", "geography"]).optional(),
  grade: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  type: z.enum(["MCQ", "DISC"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional()
});