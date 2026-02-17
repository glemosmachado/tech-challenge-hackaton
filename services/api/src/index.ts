import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb } from "./db.js";

const PORT = Number(process.env.PORT ?? 3001);

async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing env var: MONGODB_URI");

  await connectDb(uri);

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("[api] bootstrap error", err);
  process.exit(1);
});