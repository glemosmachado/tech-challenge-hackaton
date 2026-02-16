import { Schema, model, Types } from "mongoose";

export type ExamVersion = "A" | "B";

export interface ExamVersionData {
  version: ExamVersion;
  questionOrder: Types.ObjectId[];
  optionsOrderByQuestion: Record<string, number[]>; 
}

export interface Exam {
  teacherId: string;
  title: string;

  subject: string;
  grade: string;
  topic: string;

  questionIds: Types.ObjectId[];
  versions: ExamVersionData[];

  createdAt: Date;
  updatedAt: Date;
}

const examVersionSchema = new Schema<ExamVersionData>(
  {
    version: { type: String, required: true, enum: ["A", "B"] },
    questionOrder: [{ type: Schema.Types.ObjectId, ref: "Question", required: true }],
    optionsOrderByQuestion: { type: Object, required: true }
  },
  { _id: false }
);

const examSchema = new Schema<Exam>(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },

    subject: { type: String, required: true, index: true },
    grade: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },

    questionIds: [{ type: Schema.Types.ObjectId, ref: "Question", required: true }],
    versions: { type: [examVersionSchema], required: true }
  },
  { timestamps: true }
);

export const ExamModel = model<Exam>("Exam", examSchema);