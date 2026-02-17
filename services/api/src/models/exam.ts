import mongoose, { Schema, model, type Model, type Types } from "mongoose";

export type ExamVersion = "A" | "B";

export interface ExamVersionConfig {
  version: ExamVersion;
  questionOrder: Types.ObjectId[];
}

export interface Exam {
  teacherId: string;
  title: string;
  subject: string;
  grade: string;
  topics: string[];
  questionIds: Types.ObjectId[];
  versions: ExamVersionConfig[];
  mode?: "MIXED" | "MCQ" | "DISC";
  createdAt: Date;
  updatedAt: Date;
}

const versionSchema = new Schema<ExamVersionConfig>(
  {
    version: { type: String, required: true, enum: ["A", "B"] },
    questionOrder: { type: [Schema.Types.ObjectId], required: true }
  },
  { _id: false }
);

const examSchema = new Schema<Exam>(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subject: { type: String, required: true, index: true },
    grade: { type: String, required: true, index: true },
    topics: { type: [String], required: true, default: [], index: true },
    mode: { type: String, required: false, enum: ["MIXED", "MCQ", "DISC"], default: "MIXED" },
    questionIds: { type: [Schema.Types.ObjectId], required: true },
    versions: { type: [versionSchema], required: true, default: [] }
  },
  { timestamps: true }
);

examSchema.index({ teacherId: 1, subject: 1, grade: 1, createdAt: -1 });

export const ExamModel: Model<Exam> =
  (mongoose.models.Exam as Model<Exam>) || model<Exam>("Exam", examSchema);

export default ExamModel;