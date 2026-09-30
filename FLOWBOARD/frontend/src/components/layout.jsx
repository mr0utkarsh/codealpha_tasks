import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './badges';
import { NavItems } from './nav';
import { Logo } from './ui';

const MOBILE_NAV = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/search', label: 'Search', icon: Search },
];

export function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <button type="button" onClick={() => navigate('/app')} aria-label="Go to dashboard">
            <Logo />
          </button>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/projects')}
              className="hidden items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 sm:inline-flex"
            >
              <Plus size={16} /> New project
            </button>
            <div className="ml-1 flex items-center gap-2.5 rounded-xl border border-slate-200 py-1 pl-1 pr-2.5 dark:border-slate-700">
              <Avatar name={user?.name} size={30} />
              <span className="hidden max-w-[120px] truncate text-sm font-semibold md:block">
                {user?.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 pb-24 sm:px-6 lg:pb-10">
        <aside className="sticky top-20 mt-6 hidden h-[calc(100vh-6.5rem)] w-60 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:flex dark:border-slate-800 dark:bg-slate-900">
          <NavItems />
          <div className="mt-auto rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} />
              <p className="text-sm font-bold">Stay in flow</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-brand-100">
              Move one card forward today. Small steps ship big projects.
            </p>
          </div>
        </aside>
        <main className="mt-6 min-w-0 flex-1">{children}</main>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-4 shadow-pop dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <Logo size={32} />
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      )}
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        <div className="grid grid-cols-4 gap-1 px-3 py-2">
          {MOBILE_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to + label}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold ${
                  isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
