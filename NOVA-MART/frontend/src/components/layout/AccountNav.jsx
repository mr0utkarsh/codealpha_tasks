import { NavLink } from 'react-router-dom';
import { Package, User } from 'lucide-react';
import { cn } from '../../lib/format.js';

const LINKS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package, end: false },
];

/**
 * Section nav shared by the account screens.
 *
 * @param {{ className?: string }} props
 */
export function AccountNav({ className }) {
  return (
    <nav
      aria-label="Account sections"
      className={cn(
        'flex gap-2 overflow-x-auto rounded-2xl border border-ink-100 bg-white p-2 dark:border-ink-800 dark:bg-ink-900/40 lg:flex-col',
        className
      )}
    >
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition lg:flex-none lg:justify-start',
              isActive
                ? 'bg-ink-950 text-white shadow-soft dark:bg-white dark:text-ink-950'
                : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/70'
            )
          }
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default AccountNav;
