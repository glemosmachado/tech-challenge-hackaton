import { z } from "zod";

const base = z.object({
  teacherId: z.string().min(1),
  subject: z.string().min(1),
  grade: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["MCQ", "TF"]),
  statement: z.string().min(1)
});

const mcq = base.extend({
  type: z.literal("MCQ"),
  options: z.array(z.string().min(1)).min(4).max(5),
  correctIndex: z.number().int().min(0).max(4)
});

const tf = base.extend({
  type: z.literal("TF"),
  correctBoolean: z.boolean()
});

export const createQuestionSchema = z.discriminatedUnion("type", [mcq, tf]);

export const listQuestionsQuerySchema = z.object({
  teacherId: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  grade: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  type: z.enum(["MCQ", "TF"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional()
});