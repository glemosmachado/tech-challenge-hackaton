const API_URL = import.meta.env.VITE_API_BASE_URL as string;

export type UserRole = "TEACHER" | "STUDENT" | "ADMIN";
export type Subject = "physics" | "geography";
export type QuestionType = "MCQ" | "DISC";
export type Difficulty = "easy" | "medium" | "hard";
export type ExamMode = "MIXED" | "MCQ" | "DISC";
export type ExamVersion = "A" | "B";
export type RenderAudience = "teacher" | "student";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ExamDTO {
  _id: string;
  teacherId: string;
  title: string;
  subject: Subject;
  grade: string;
  topics: string[];
  mode: ExamMode;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComposeExamRequest {
  teacherId?: string;
  title: string;
  subject: Subject;
  grade: string;
  topics: string[];
  count: number;
  mode?: ExamMode;
}

export type RenderedQuestion =
  | {
      id: string;
      type: "MCQ";
      statement: string;
      topic: string;
      difficulty: Difficulty;
      options: string[];
      answerKey?: number;
    }
  | {
      id: string;
      type: "DISC";
      statement: string;
      topic: string;
      difficulty: Difficulty;
      expectedAnswer?: string;
      rubric?: string;
    };

export interface RenderExamResponse {
  exam: {
    id: string;
    title: string;
    subject: Subject;
    grade: string;
    topics: string[];
    version: ExamVersion;
  };
  questions: RenderedQuestion[];
}

type ApiErrorBody = { error?: unknown };

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  const body: unknown = await res.json().catch(() => ({}));
  if (typeof body === "object" && body && "error" in body) {
    const err = (body as ApiErrorBody).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  return fallback;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) throw new Error(await parseError(res, `LOGIN_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as AuthResponse;
}

export async function apiRegister(input: {
  name: string;
  email: string;
  password: string;
  role: "TEACHER" | "STUDENT";
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) throw new Error(await parseError(res, `REGISTER_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as AuthResponse;
}

export async function apiMe(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: authHeaders(token)
  });

  if (!res.ok) throw new Error(await parseError(res, `ME_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as { user: AuthUser };
}

export async function getTopics(params: { token: string; subject: Subject; grade: string }): Promise<string[]> {
  const qs = new URLSearchParams({ subject: params.subject, grade: params.grade }).toString();

  const res = await fetch(`${API_URL}/questions/topics?${qs}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `TOPICS_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "topics" in data) {
    const topics = (data as { topics: unknown }).topics;
    if (Array.isArray(topics) && topics.every((t) => typeof t === "string")) return topics;
  }
  return [];
}

export async function composeExam(params: { token: string; payload: ComposeExamRequest }): Promise<{ exam: ExamDTO }> {
  const res = await fetch(`${API_URL}/exams/compose`, {
    method: "POST",
    headers: { ...authHeaders(params.token), "Content-Type": "application/json" },
    body: JSON.stringify(params.payload)
  });

  if (!res.ok) throw new Error(await parseError(res, `COMPOSE_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as { exam: ExamDTO };
}

export async function listExams(params: { token: string }): Promise<ExamDTO[]> {
  const res = await fetch(`${API_URL}/exams`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `LIST_EXAMS_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "exams" in data) {
    const exams = (data as { exams: unknown }).exams;
    if (Array.isArray(exams)) return exams as ExamDTO[];
  }
  return [];
}

export async function deleteExam(params: { token: string; examId: string }): Promise<{ ok: true }> {
  const res = await fetch(`${API_URL}/exams/${params.examId}`, {
    method: "DELETE",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `DELETE_EXAM_FAILED_${res.status}`));
  const data: unknown = await res.json();
  return data as { ok: true };
}

export async function renderExam(params: {
  token: string;
  examId: string;
  version: ExamVersion;
  audience?: RenderAudience;
}): Promise<RenderExamResponse> {
  const qs = new URLSearchParams({
    version: params.version,
    audience: params.audience ?? "teacher"
  }).toString();

  const res = await fetch(`${API_URL}/exams/${params.examId}/render?${qs}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `RENDER_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as RenderExamResponse;
}

export interface QuestionDTO {
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
  createdAt?: string;
  updatedAt?: string;
}

export type CreateQuestionPayload =
  | {
      subject: Subject;
      grade: string;
      topic: string;
      difficulty: Difficulty;
      type: "MCQ";
      statement: string;
      options: string[];
      correctIndex: number;
    }
  | {
      subject: Subject;
      grade: string;
      topic: string;
      difficulty: Difficulty;
      type: "DISC";
      statement: string;
      expectedAnswer?: string;
      rubric?: string;
    };

export async function listQuestions(params: {
  token: string;
  subject: Subject;
  grade: string;
  topic?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
}): Promise<QuestionDTO[]> {
  const qs = new URLSearchParams({
    subject: params.subject,
    grade: params.grade,
    ...(params.topic ? { topic: params.topic } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.difficulty ? { difficulty: params.difficulty } : {})
  }).toString();

  const res = await fetch(`${API_URL}/questions?${qs}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `LIST_QUESTIONS_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "questions" in data) {
    const qsList = (data as { questions: unknown }).questions;
    if (Array.isArray(qsList)) return qsList as QuestionDTO[];
  }
  return [];
}

export async function createQuestion(params: { token: string; payload: CreateQuestionPayload }): Promise<QuestionDTO> {
  const res = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { ...authHeaders(params.token), "Content-Type": "application/json" },
    body: JSON.stringify(params.payload)
  });

  if (!res.ok) throw new Error(await parseError(res, `CREATE_QUESTION_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as QuestionDTO;
}

export async function updateQuestion(params: { token: string; id: string; payload: CreateQuestionPayload }): Promise<QuestionDTO> {
  const res = await fetch(`${API_URL}/questions/${params.id}`, {
    method: "PUT",
    headers: { ...authHeaders(params.token), "Content-Type": "application/json" },
    body: JSON.stringify(params.payload)
  });

  if (!res.ok) throw new Error(await parseError(res, `UPDATE_QUESTION_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as QuestionDTO;
}

export async function deleteQuestion(params: { token: string; id: string }): Promise<{ ok: true }> {
  const res = await fetch(`${API_URL}/questions/${params.id}`, {
    method: "DELETE",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `DELETE_QUESTION_FAILED_${res.status}`));
  const data: unknown = await res.json();
  return data as { ok: true };
}

export interface StudentDTO {
  _id: string;
  name: string;
  email: string;
  role: "STUDENT";
  createdAt?: string;
  updatedAt?: string;
}

export async function listStudents(params: { token: string }): Promise<StudentDTO[]> {
  const qs = new URLSearchParams({ role: "STUDENT" }).toString();

  const res = await fetch(`${API_URL}/users?${qs}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `LIST_STUDENTS_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "users" in data) {
    const users = (data as { users: unknown }).users;
    if (Array.isArray(users)) return users as StudentDTO[];
  }
  return [];
}