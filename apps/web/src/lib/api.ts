const API_URL = import.meta.env.VITE_API_URL as string;

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

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    if (typeof body === "object" && body && "error" in body) {
      throw new Error(String((body as { error?: unknown }).error ?? `LOGIN_FAILED_${res.status}`));
    }
    throw new Error(`LOGIN_FAILED_${res.status}`);
  }

  return res.json();
}

export async function apiMe(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: authHeaders(token)
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    if (typeof body === "object" && body && "error" in body) {
      throw new Error(String((body as { error?: unknown }).error ?? `ME_FAILED_${res.status}`));
    }
    throw new Error(`ME_FAILED_${res.status}`);
  }

  return res.json();
}