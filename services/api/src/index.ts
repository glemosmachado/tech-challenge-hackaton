import "dotenv/config";
import { createApp } from "./app";
import { connectDb } from "./db";

const PORT = Number(process.env.PORT ?? 3001);

async function bootstrap() {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("Missing env var: MONGODB_URI");
  }

  const conn = await connectDb(mongodbUri);

  conn.on("connected", () => {
    console.log("[db] connected");
  });

  conn.on("error", (err) => {
    console.error("[db] error", err);
  });

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("[api] bootstrap error", err);
  process.exit(1);
});