import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);

  app.get("/", (_req, res) => {
    res.json({ name: "postech-api", status: "ok" });
  });

  return app;
}
