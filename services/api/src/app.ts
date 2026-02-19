import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { questionsRouter } from "./routes/questions.js";
import { examsRouter } from "./routes/exams.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/questions", questionsRouter);
  app.use("/exams", examsRouter);
  app.use("/users", usersRouter);

  app.get("/", (_req, res) => {
    res.json({ name: "postech-api", status: "ok" });
  });

  return app;
}