import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { questionsRouter } from "./routes/questions";
import { examsRouter } from "./routes/exams";
import { authRouter } from "./routes/auth";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/questions", questionsRouter);
  app.use("/exams", examsRouter);

  app.get("/", (_req, res) => {
    res.json({ name: "postech-api", status: "ok" });
  });

  return app;
}