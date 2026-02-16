import { Schema, model } from "mongoose";

export type UserRole = "TEACHER" | "STUDENT";

export interface User {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["TEACHER", "STUDENT"], index: true },
    name: { type: String, required: true }
  },
  { timestamps: true }
);

export const UserModel = model<User>("User", userSchema);