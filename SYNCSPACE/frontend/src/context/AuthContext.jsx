import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";
const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = localStorage.getItem("syncspace_token");
    if (!t) { setLoading(false); return; }
    api.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem("syncspace_token")).finally(() => setLoading(false));
  }, []);
  const login = useCallback(async (email, password) => {
    const d = await api.login({ email, password });
    localStorage.setItem("syncspace_token", d.token);
    setUser(d.user);
    return d.user;
  }, []);
  const register = useCallback(async (payload) => {
    const d = await api.register(payload);
    localStorage.setItem("syncspace_token", d.token);
    setUser(d.user);
    return d.user;
  }, []);
  const logout = useCallback(() => { localStorage.removeItem("syncspace_token"); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
