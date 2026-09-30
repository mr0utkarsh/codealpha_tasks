import { Link, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950"><Video size={18} /></span>
            <span className="font-extrabold tracking-tight">SYNCSPACE</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} aria-label="Toggle theme" title="Toggle theme" className="btn-ghost !px-3">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
            {user && <span className="hidden text-sm text-slate-300 sm:block">{user.name}</span>}
            {user && <button onClick={() => { logout(); nav("/login"); }} aria-label="Log out" title="Log out" className="btn-ghost !px-3"><LogOut size={16} /></button>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
