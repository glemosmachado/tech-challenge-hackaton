const baseUrl = import.meta.env.VITE_API_BASE_URL as string;

if (!baseUrl) {
  throw new Error("Missing VITE_API_BASE_URL");
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function headersJson() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) h.Authorization = `Bearer ${authToken}`;
  return h;
}

function headersAuthOnly() {
  const h: Record<string, string> = {};
  if (authToken) h.Authorization = `Bearer ${authToken}`;
  return h;
}

export type UserRole = "TEACHER" | "STUDENT";

export type AuthUser = {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

export type QuestionType = "MCQ" | "DISC";
export type Difficulty = "easy" | "medium" | "hard";
export type Subject = "physics" | "geography";

export type Question = {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
};

export type ExamVersion = {
  version: "A" | "B";
  questionOrder: string[];
  optionsOrderByQuestion: Record<string, number[]>;
};

export type Exam = {
  _id: string;
  teacherId: string;
  title: string;
  subject: Subject;
  grade: string;
  topic: string;
  questionIds: string[];
  versions: ExamVersion[];
  createdAt: string;
  updatedAt: string;
};

export type ExamComposeRequest = {
  title: string;
  subject: Subject;
  grade: string;
  topic: string;
  qty: number;
  difficulty?: Difficulty;
  types?: QuestionType[];
};

export type RenderedExamMeta = {
  id: string;
  title: string;
  subject: Subject;
  grade: string;
  topic: string;
  version: "A" | "B";
  mode: "teacher" | "student";
};

export type RenderedQuestionMCQTeacher = {
  id: string;
  type: "MCQ";
  statement: string;
  options: string[];
  answerKey: number | null;
};

export type RenderedQuestionMCQStudent = {
  id: string;
  type: "MCQ";
  statement: string;
  options: string[];
};

export type RenderedQuestionDISCTeacher = {
  id: string;
  type: "DISC";
  statement: string;
  expectedAnswer: string | null;
  rubric: string | null;
};

export type RenderedQuestionDISCStudent = {
  id: string;
  type: "DISC";
  statement: string;
};

export type RenderedQuestionTeacher = RenderedQuestionMCQTeacher | RenderedQuestionDISCTeacher;
export type RenderedQuestionStudent = RenderedQuestionMCQStudent | RenderedQuestionDISCStudent;

export type RenderExamTeacherResponse = {
  exam: RenderedExamMeta;
  questions: RenderedQuestionTeacher[];
};

export type RenderExamStudentResponse = {
  exam: RenderedExamMeta;
  questions: RenderedQuestionStudent[];
};

export type RenderExamResponse = RenderExamTeacherResponse | RenderExamStudentResponse;

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  if (!res.ok) {
    throw new Error(`request failed: ${res.status}`);
  }
  return data;
}

export async function register(body: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: headersJson(),
    body: JSON.stringify(body)
  });
  return parseJsonOrThrow<AuthResponse>(res);
}

export async function login(body: { email: string; password: string }) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: headersJson(),
    body: JSON.stringify(body)
  });
  return parseJsonOrThrow<AuthResponse>(res);
}

export async function me() {
  const res = await fetch(`${baseUrl}/auth/me`, {
    method: "GET",
    headers: headersAuthOnly()
  });
  return parseJsonOrThrow<{ user: AuthUser }>(res);
}

export async function listQuestions(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${baseUrl}/questions?${qs}`, {
    headers: headersAuthOnly()
  });
  return parseJsonOrThrow<{ total: number; items: Question[] }>(res);
}

export async function createQuestion(body: Omit<Question, "_id" | "teacherId" | "createdAt" | "updatedAt">) {
  const res = await fetch(`${baseUrl}/questions`, {
    method: "POST",
    headers: headersJson(),
    body: JSON.stringify(body)
  });
  if (res.status === 409) throw new Error("DUPLICATE_QUESTION");
  return parseJsonOrThrow<Question>(res);
}

export async function listExams() {
  const res = await fetch(`${baseUrl}/exams`, {
    headers: headersAuthOnly()
  });
  return parseJsonOrThrow<{ total: number; items: Exam[] }>(res);
}

export async function composeExam(body: ExamComposeRequest) {
  const res = await fetch(`${baseUrl}/exams/compose`, {
    method: "POST",
    headers: headersJson(),
    body: JSON.stringify(body)
  });
  return parseJsonOrThrow<Exam>(res);
}

export async function deleteExam(examId: string) {
  const res = await fetch(`${baseUrl}/exams/${examId}`, {
    method: "DELETE",
    headers: headersAuthOnly()
  });
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (res.status !== 204) throw new Error(`deleteExam failed: ${res.status}`);
}

export async function renderExam(examId: string, version: "A" | "B", mode: "teacher" | "student") {
  const res = await fetch(`${baseUrl}/exams/${examId}/render?version=${version}&mode=${mode}`, {
    headers: headersAuthOnly()
  });
  return parseJsonOrThrow<RenderExamResponse>(res);
}