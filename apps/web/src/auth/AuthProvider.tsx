import { useEffect, useMemo, useState } from "react";
import { clearToken, initAuth, saveToken, getToken } from "./auth";
import { login as apiLogin, me as apiMe, type AuthUser, type UserRole } from "../lib/api";
import { AuthContext, type AuthCtx } from "./context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
    const t = getToken();
    setToken(t);

    (async () => {
      if (!t) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiMe();
        setUser(data.user);
      } catch {
        clearToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function signIn(email: string, password: string): Promise<UserRole> {
    const resp = await apiLogin({ email, password });
    saveToken(resp.token);
    setToken(resp.token);

    const data = await apiMe();
    setUser(data.user);

    return data.user.role;
  }

  function signOut() {
    clearToken();
    setToken(null);
    setUser(null);
  }

  async function refresh() {
    if (!token) return;
    const data = await apiMe();
    setUser(data.user);
  }

  const value = useMemo<AuthCtx>(
    () => ({ token, user, loading, signIn, signOut, refresh }),
    [token, user, loading, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}