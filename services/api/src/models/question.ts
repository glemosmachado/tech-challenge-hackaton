import { Schema, model } from "mongoose";

export type QuestionType = "MCQ" | "TF";

export interface Question {
  teacherId: string;
  subject: string;
  grade: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  type: QuestionType;

  statement: string;

  options?: string[];
  correctIndex?: number;

  correctBoolean?: boolean; 

  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<Question>(
  {
    teacherId: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    grade: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    difficulty: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ["MCQ", "TF"], index: true },

    statement: { type: String, required: true },

    options: { type: [String], required: false },
    correctIndex: { type: Number, required: false },

    correctBoolean: { type: Boolean, required: false }
  },
  { timestamps: true }
);

export const QuestionModel = model<Question>("Question", questionSchema);