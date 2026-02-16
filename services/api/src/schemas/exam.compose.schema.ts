import { z } from "zod";

export const composeExamSchema = z.object({
  teacherId: z.string().min(1),
  title: z.string().min(1),

  subject: z.enum(["physics", "geography"]),
  grade: z.string().min(1),
  topic: z.string().min(1),

  qty: z.number().int().min(1).max(50),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  types: z.array(z.enum(["MCQ", "DISC"])).min(1).optional()
});