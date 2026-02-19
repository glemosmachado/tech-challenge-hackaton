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

export type QuestionDTO = {
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
};

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
    if (Array.isArray(topics) && topics.every((t) => typeof t === "string")) {
      return (topics as string[]).map((t) => t.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b));
    }
  }

  return [];
}

export async function composeExam(params: { token: string; payload: ComposeExamRequest }): Promise<{ exam: ExamDTO }> {
  const res = await fetch(`${API_URL}/exams/compose`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(params.payload)
  });

  if (!res.ok) throw new Error(await parseError(res, `COMPOSE_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "exam" in data) {
    return { exam: (data as { exam: ExamDTO }).exam };
  }

  throw new Error("COMPOSE_INVALID_RESPONSE");
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

export async function deleteExam(params: { token: string; examId: string }): Promise<void> {
  const res = await fetch(`${API_URL}/exams/${params.examId}`, {
    method: "DELETE",
    headers: authHeaders(params.token)
  });

  if (res.status === 204) return;
  if (!res.ok) throw new Error(await parseError(res, `DELETE_EXAM_FAILED_${res.status}`));
}

export async function renderExam(params: {
  token: string;
  examId: string;
  version: ExamVersion;
  audience: RenderAudience;
}): Promise<RenderExamResponse> {
  const qs = new URLSearchParams({ version: params.version, audience: params.audience }).toString();

  const res = await fetch(`${API_URL}/exams/${params.examId}/render?${qs}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `RENDER_FAILED_${res.status}`));

  const data: unknown = await res.json();
  return data as RenderExamResponse;
}

export async function listQuestions(params: {
  token: string;
  subject?: Subject;
  grade?: string;
  topic?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
}): Promise<QuestionDTO[]> {
  const qs = new URLSearchParams();
  if (params.subject) qs.set("subject", params.subject);
  if (params.grade) qs.set("grade", params.grade);
  if (params.topic) qs.set("topic", params.topic);
  if (params.type) qs.set("type", params.type);
  if (params.difficulty) qs.set("difficulty", params.difficulty);

  const res = await fetch(`${API_URL}/questions?${qs.toString()}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `LIST_QUESTIONS_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "questions" in data) {
    const questions = (data as { questions: unknown }).questions;
    if (Array.isArray(questions)) return questions as QuestionDTO[];
  }
  return [];
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

export async function createQuestion(params: { token: string; payload: CreateQuestionPayload }): Promise<QuestionDTO> {
  const res = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(params.payload)
  });

  if (!res.ok) throw new Error(await parseError(res, `CREATE_QUESTION_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "question" in data) return (data as { question: QuestionDTO }).question;
  throw new Error("CREATE_QUESTION_INVALID_RESPONSE");
}

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export async function updateQuestion(params: {
  token: string;
  id: string;
  payload: UpdateQuestionPayload;
}): Promise<QuestionDTO> {
  const res = await fetch(`${API_URL}/questions/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(params.payload)
  });

  if (!res.ok) throw new Error(await parseError(res, `UPDATE_QUESTION_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "question" in data) return (data as { question: QuestionDTO }).question;
  throw new Error("UPDATE_QUESTION_INVALID_RESPONSE");
}

export async function deleteQuestion(params: { token: string; id: string }): Promise<void> {
  const res = await fetch(`${API_URL}/questions/${params.id}`, {
    method: "DELETE",
    headers: authHeaders(params.token)
  });

  if (res.status === 204) return;
  if (!res.ok) throw new Error(await parseError(res, `DELETE_QUESTION_FAILED_${res.status}`));
}