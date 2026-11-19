import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get, post } from "../api/api.js";

/*
 * Keeps track of the logged-in customer for the whole app.
 *   const { user, loading, login, register, verifyCode, resendCode, logout } = useAuth();
 * In Milestone 1 the "session" is mock (see api.js); in Milestone 2 the
 * same calls go to the Express auth endpoints.
 */
const AuthContext = createContext(null);

// Where each account type lands after logging in.
export function homeFor(user) {
  return user?.role === "owner" ? "/dashboard" : "/";
}

// Send a user back to the page they wanted, if their account type may open it.
export function afterLoginPath(user, from) {
  if (!from || from === "/login" || from === "/signup") return homeFor(user);
  const ownerPage = from.startsWith("/dashboard");
  if (user.role === "owner") return ownerPage ? from : homeFor(user);
  return ownerPage ? homeFor(user) : from;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when the session check fails because the server is unreachable
  // (not because nobody is logged in), so pages show an error, not the login page.
  const [authError, setAuthError] = useState(null);
  const [checkKey, setCheckKey] = useState(0);

  // On first load (and on retry), ask the API who is logged in (if anyone).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAuthError(null);
    get("/api/me")
      .then((me) => !cancelled && setUser(me.user))
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) setUser(null);
        else setAuthError(err);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [checkKey]);

  const recheck = useCallback(() => setCheckKey((k) => k + 1), []);

  const login = useCallback(async (values) => {
    const u = await post("/api/auth/login", values);
    setAuthError(null);
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

  return <AuthContext.Provider value={{ user, loading, authError, recheck, login, register, verifyCode, resendCode, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
