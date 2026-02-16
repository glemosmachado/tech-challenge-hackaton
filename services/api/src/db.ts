import mongoose from "mongoose";

export async function connectDb(mongodbUri: string) {
  mongoose.set("strictQuery", true);

  console.log("[db] connecting to:", mongodbUri.split("@")[1]);

  await mongoose.connect(mongodbUri);

  console.log("[db] connected successfully");

  return mongoose.connection;
}