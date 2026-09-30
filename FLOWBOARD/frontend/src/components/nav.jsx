import { NavLink } from 'react-router-dom';
import { FolderKanban, Home, Users } from 'lucide-react';

export const NAV = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/team', label: 'Team', icon: Users },
];

export function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`
          }
        >
          <Icon size={19} className="shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
