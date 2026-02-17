import { Router } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../models/user.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { name, email, password, role } = parsed.data;

  const exists = await UserModel.findOne({ email });
  if (exists) return res.status(409).json({ error: "EMAIL_ALREADY_USED" });

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await UserModel.create({
    name,
    email,
    passwordHash,
    role
  });

  const token = signToken({
    sub: String(created._id),
    role: created.role,
    email: created.email,
    name: created.name
  });

  return res.status(201).json({
    token,
    user: { id: String(created._id), name: created.name, email: created.email, role: created.role }
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const token = signToken({
    sub: String(user._id),
    role: user.role,
    email: user.email,
    name: user.name
  });

  return res.json({
    token,
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});