import { Router } from "express";
import UserModel from "../models/user.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requireRole("TEACHER"), async (req, res) => {
  const role = (req.query.role as string | undefined) ?? "STUDENT";

  const users = await UserModel.find({ role })
    .select("_id name email role createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ users });
});