import { Schema, model } from "mongoose";

export type Subject = "physics" | "geography";
export type QuestionType = "MCQ" | "DISC";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  teacherId: string;
  subject: Subject;
  grade: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;

  statement: string;

  options?: string[];
  correctIndex?: number;

  expectedAnswer?: string;
  rubric?: string;

  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<Question>(
  {
    teacherId: { type: String, required: true, index: true },
    subject: { type: String, required: true, enum: ["physics", "geography"], index: true },
    grade: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"], index: true },
    type: { type: String, required: true, enum: ["MCQ", "DISC"], index: true },

    statement: { type: String, required: true },

    options: { type: [String], required: false },
    correctIndex: { type: Number, required: false },

    expectedAnswer: { type: String, required: false },
    rubric: { type: String, required: false }
  },
  { timestamps: true }
);

questionSchema.index(
  { teacherId: 1, subject: 1, grade: 1, topic: 1, type: 1, statement: 1 },
  { unique: true }
);

export const QuestionModel = model<Question>("Question", questionSchema);