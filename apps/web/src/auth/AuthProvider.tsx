import { useEffect, useMemo, useState } from "react";
import { clearToken, getToken, saveToken } from "./auth";
import { apiLogin, apiMe, apiRegister, type AuthUser } from "../lib/api";
import { AuthContext } from "./context";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const t = getToken();
        setToken(t);

        if (!t) {
          if (!cancelled) {
            setUser(null);
            setIsBootstrapping(false);
          }
          return;
        }

        const me = await apiMe(t);
        if (!cancelled) {
          setUser(me.user);
          setIsBootstrapping(false);
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setToken(null);
          setUser(null);
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const res = await apiLogin(email, password);
    saveToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }

  async function signUp(input: { name: string; email: string; password: string; role: "TEACHER" | "STUDENT" }) {
    const res = await apiRegister(input);
    saveToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }

  function signOut() {
    clearToken();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, isBootstrapping, signIn, signUp, signOut }),
    [user, token, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}