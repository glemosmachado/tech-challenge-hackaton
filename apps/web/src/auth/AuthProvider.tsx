import { useEffect, useMemo, useState } from "react";
import { clearToken, getToken, saveToken } from "./auth";
import { apiLogin, apiMe, type AuthUser } from "../lib/api";
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

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    saveToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    clearToken();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, isBootstrapping, login, logout }),
    [user, token, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}