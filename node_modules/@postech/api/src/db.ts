import mongoose from "mongoose";

export async function connectDb(mongodbUri: string) {
  mongoose.set("strictQuery", true);

  await mongoose.connect(mongodbUri);

  return mongoose.connection;
}