import { z } from "zod";

export const createExamSchema = z.object({
  teacherId: z.string().min(1),
  title: z.string().min(1),

  subject: z.string().min(1),
  grade: z.string().min(1),
  topic: z.string().min(1),

  questionIds: z.array(z.string().min(1)).min(1).max(50)
});