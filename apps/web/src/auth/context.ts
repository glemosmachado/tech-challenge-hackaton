import { createContext } from "react";
import type { AuthUser } from "../lib/api";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isBootstrapping: true,
  login: async () => {},
  logout: () => {}
});