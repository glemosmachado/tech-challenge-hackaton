const API_URL = import.meta.env.VITE_API_BASE_URL as string;

export type UserRole = "TEACHER" | "STUDENT" | "ADMIN";

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

export type QuestionType = "MCQ" | "DISC";
export type Difficulty = "easy" | "medium" | "hard";

export interface QuestionDTO {
  _id?: string;
  id?: string;
  teacherId: string;
  subject: string;
  grade: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  statement: string;
  options?: string[];
  correctIndex?: number;
  expectedAnswer?: string;
  rubric?: string;
}

export interface ExamDTO {
  _id?: string;
  id?: string;
  teacherId: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  mode?: "MIXED" | "MCQ" | "DISC";
  createdAt?: string;
  updatedAt?: string;
}

export interface ComposeExamRequest {
  teacherId: string;
  title: string;
  subject: string;
  grade: string;
  topics: string[];
  count: number;
  mode?: "MIXED" | "MCQ" | "DISC";
}

export interface ComposeExamResponse {
  exam: unknown;
  questions: QuestionDTO[];
}

type ApiErrorBody = { error?: unknown };
type TopicsResponse = { topics: unknown };
type MeResponse = { user: AuthUser };
type ComposeResponse = { exam: unknown; questions: unknown };
type ListExamsResponse = { exams: unknown };

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
  if (
    typeof data === "object" &&
    data &&
    "token" in data &&
    typeof (data as { token: unknown }).token === "string" &&
    "user" in data
  ) {
    return data as AuthResponse;
  }

  throw new Error("LOGIN_INVALID_RESPONSE");
}

export async function apiMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: authHeaders(token)
  });

  if (!res.ok) throw new Error(await parseError(res, `ME_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "user" in data) return data as MeResponse;

  throw new Error("ME_INVALID_RESPONSE");
}

export async function getTopics(params: { token: string; subject: string; grade: string }): Promise<string[]> {
  const qs = new URLSearchParams({ subject: params.subject, grade: params.grade }).toString();

  const res = await fetch(`${API_URL}/questions/topics?${qs}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `TOPICS_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "topics" in data) {
    const topics = (data as TopicsResponse).topics;
    if (Array.isArray(topics) && topics.every((t) => typeof t === "string")) return topics;
  }

  return [];
}

export async function composeExam(params: {
  token: string;
  payload: ComposeExamRequest;
}): Promise<ComposeExamResponse> {
  const res = await fetch(`${API_URL}/exams/compose`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(params.payload)
  });

  if (!res.ok) throw new Error(await parseError(res, `COMPOSE_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "exam" in data && "questions" in data) {
    const questions = (data as ComposeResponse).questions;
    if (Array.isArray(questions)) {
      return { exam: (data as ComposeResponse).exam, questions: questions as QuestionDTO[] };
    }
  }

  throw new Error("COMPOSE_INVALID_RESPONSE");
}

export async function listExams(params: { token: string; teacherId?: string }): Promise<ExamDTO[]> {
  const qs = params.teacherId ? `?${new URLSearchParams({ teacherId: params.teacherId }).toString()}` : "";

  const res = await fetch(`${API_URL}/exams${qs}`, {
    method: "GET",
    headers: authHeaders(params.token)
  });

  if (!res.ok) throw new Error(await parseError(res, `LIST_EXAMS_FAILED_${res.status}`));

  const data: unknown = await res.json();
  if (typeof data === "object" && data && "exams" in data) {
    const exams = (data as ListExamsResponse).exams;
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

export function renderExam(input: {
  title: string;
  subject?: string;
  grade?: string;
  topics?: string[];
  questions: QuestionDTO[];
}): string {
  const headerLines: string[] = [];
  headerLines.push(input.title);

  const meta: string[] = [];
  if (input.subject) meta.push(`Disciplina: ${input.subject}`);
  if (input.grade) meta.push(`Série/Ano: ${input.grade}`);
  if (input.topics?.length) meta.push(`Tópicos: ${input.topics.join(", ")}`);
  if (meta.length) headerLines.push(meta.join(" | "));

  headerLines.push("");
  headerLines.push("INSTRUÇÕES:");
  headerLines.push("- Responda com atenção.");
  headerLines.push("");

  const body: string[] = input.questions.map((q, idx) => {
    const n = idx + 1;
    const lines: string[] = [];
    lines.push(`${n}) ${q.statement}`);

    if (q.type === "MCQ" && Array.isArray(q.options) && q.options.length) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      q.options.forEach((opt, i) => {
        const letter = letters[i] ?? "?";
        lines.push(`   ${letter}) ${opt}`);
      });
    } else {
      lines.push("");
      lines.push("   _____________________________________________");
      lines.push("   _____________________________________________");
      lines.push("   _____________________________________________");
    }

    return lines.join("\n");
  });

  return [...headerLines, ...body].join("\n");
}