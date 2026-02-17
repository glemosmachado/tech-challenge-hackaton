import { createContext } from "react";
import type { AuthUser, UserRole } from "../lib/api";

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
};

export type AuthCtx = AuthState & {
  signIn(email: string, password: string): Promise<UserRole>;
  signOut(): void;
  refresh(): Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);