import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get, post } from "../api/api.js";

/*
 * Keeps track of the logged-in customer for the whole app.
 *   const { user, loading, login, register, verifyCode, resendCode, logout } = useAuth();
 * In Milestone 1 the "session" is mock (see api.js); in Milestone 2 the
 * same calls go to the Express auth endpoints.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the API who is logged in (if anyone).
  useEffect(() => {
    let cancelled = false;
    get("/api/me")
      .then((me) => !cancelled && setUser(me.user))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (values) => {
    const u = await post("/api/auth/login", values);
    setUser(u);
    return u;
  }, []);

  // Step 1 of sign-up: sends the SMS code. Returns the pending sign-up.
  const register = useCallback((values) => post("/api/auth/register", values), []);

  // Step 2 of sign-up: checks the code, creates the account and logs in.
  const verifyCode = useCallback(async (pendingId, code) => {
    const u = await post("/api/auth/verify", { pendingId, code });
    setUser(u);
    return u;
  }, []);

  const resendCode = useCallback((pendingId) => post("/api/auth/resend-code", { pendingId }), []);

  const logout = useCallback(async () => {
    await post("/api/auth/logout");
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, verifyCode, resendCode, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
