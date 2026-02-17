import { Schema, model, models, type Model, type Types } from "mongoose";

export interface Exam {
  teacherId: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  questionIds: Types.ObjectId[];
  mode?: "MIXED" | "MCQ" | "DISC";
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<Exam>(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subject: { type: String, required: true, index: true },
    grade: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    mode: { type: String, required: false, enum: ["MIXED", "MCQ", "DISC"], default: "MIXED" },
    questionIds: { type: [Schema.Types.ObjectId], required: true }
  },
  { timestamps: true }
);

export const ExamModel: Model<Exam> =
  (models.Exam as Model<Exam>) || model<Exam>("Exam", examSchema);

export default ExamModel;