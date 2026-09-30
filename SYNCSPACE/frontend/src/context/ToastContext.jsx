import { createContext, useCallback, useContext, useMemo, useState } from "react";
const Ctx = createContext(null);
let id = 1;
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, kind) => {
    const t = { id: id++, message, kind: kind || "info" };
    setToasts((prev) => [...prev.slice(-4), t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4200);
  }, []);
  const value = useMemo(() => ({ toasts, toast: push, success: (m) => push(m, "success"), error: (m) => push(m, "error") }), [toasts, push]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useToast() { return useContext(Ctx); }
export function Toasts() {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {ctx.toasts.map((t) => (
        <div key={t.id} className={"pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur " + (t.kind === "error" ? "border-rose-400/30 bg-rose-950/90 text-rose-100" : t.kind === "success" ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-100" : "border-white/10 bg-slate-900/95 text-slate-100")}>{t.message}</div>
      ))}
    </div>
  );
}
