import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, LogOut, Package, ShieldCheck, User, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { initials } from '../../lib/format.js';

/**
 * Account dropdown. Guests see sign-in / create-account actions, customers see
 * their details plus shortcuts to orders, profile and wishlist.
 */
export function UserMenu() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="hidden h-10 items-center gap-2 rounded-full border border-ink-200 px-4 text-sm font-medium text-ink-800 transition hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-100 dark:hover:bg-ink-800 md:inline-flex"
      >
        <User className="size-4" aria-hidden="true" />
        Sign in
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="grid size-10 place-items-center rounded-full bg-ink-950 text-xs font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
      >
        {initials(user.name)}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift animate-fade-up dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
            {isAdmin && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                <ShieldCheck className="size-3" aria-hidden="true" />
                Administrator
              </span>
            )}
          </div>

          <div className="p-2">
            <MenuLink to="/account/orders" icon={Package} label="My orders" onClick={() => setIsOpen(false)} />
            <MenuLink
              to="/account/profile"
              icon={UserCircle}
              label="Profile & security"
              onClick={() => setIsOpen(false)}
            />
            <MenuLink to="/wishlist" icon={Heart} label="Wishlist" onClick={() => setIsOpen(false)} />
          </div>

          <div className="border-t border-ink-100 p-2 dark:border-ink-800">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              role="menuitem"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 hover:text-ink-950 dark:text-ink-200 dark:hover:bg-ink-800 dark:hover:text-white"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export default UserMenu;
