import mongoose, { Schema, model, type Model } from "mongoose";

export type UserRole = "TEACHER" | "STUDENT" | "ADMIN";

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["TEACHER", "STUDENT", "ADMIN"], index: true }
  },
  { timestamps: true }
);

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) || model<User>("User", userSchema);

export default UserModel;