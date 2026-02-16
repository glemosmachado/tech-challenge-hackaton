import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TEACHER", "STUDENT"])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});