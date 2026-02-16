const baseUrl = import.meta.env.VITE_API_BASE_URL as string;

if (!baseUrl) {
  throw new Error("Missing VITE_API_BASE_URL");
}

export type QuestionType = "MCQ" | "TF";
export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  _id: string;
  teacherId: string;
  subject: string;
  grade: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  statement: string;
  options?: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
};

export type ExamComposeRequest = {
  teacherId: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  qty: number;
  difficulty?: Difficulty;
};

export async function listQuestions(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${baseUrl}/questions?${qs}`);
  if (!res.ok) throw new Error(`listQuestions failed: ${res.status}`);
  return res.json() as Promise<{ total: number; items: Question[] }>;
}

export async function createQuestion(body: any) {
  const res = await fetch(`${baseUrl}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (res.status === 409) throw new Error("DUPLICATE_QUESTION");
  if (!res.ok) throw new Error(`createQuestion failed: ${res.status}`);
  return res.json();
}

export async function composeExam(body: ExamComposeRequest) {
  const res = await fetch(`${baseUrl}/exams/compose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`composeExam failed: ${res.status}`);
  return res.json() as Promise<{ _id: string } & Record<string, any>>;
}

export async function renderExam(examId: string, version: "A" | "B") {
  const res = await fetch(`${baseUrl}/exams/${examId}/render?version=${version}`);
  if (!res.ok) throw new Error(`renderExam failed: ${res.status}`);
  return res.json() as Promise<{
    exam: { id: string; title: string; subject: string; grade: string; topic: string; version: "A" | "B" };
    questions: Array<
      | { id: string; type: "MCQ"; statement: string; options: string[]; answerKey: number | null }
      | { id: string; type: "TF"; statement: string; answerKey: boolean | null }
    >;
  }>;
}