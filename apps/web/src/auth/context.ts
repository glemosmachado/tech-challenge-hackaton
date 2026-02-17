import { createContext } from "react";
import type { AuthUser } from "../lib/api";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isBootstrapping: true,
  signIn: async () => {},
  signOut: () => {}
});