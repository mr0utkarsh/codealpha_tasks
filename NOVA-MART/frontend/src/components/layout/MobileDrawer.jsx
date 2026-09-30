import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Heart, LogOut, Package, UserCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getCategoryCopy } from '../../data/categoryCopy.js';
import { cn } from '../../lib/format.js';
import SearchBar from './SearchBar.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const PRIMARY_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop all', to: '/products' },
  { label: 'New arrivals', to: '/products?sort=newest' },
  { label: 'Wishlist', to: '/wishlist' },
];

const SM_LINK =
  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800/60';

function DrawerLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className={SM_LINK}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

/**
 * Slide-in navigation for small screens.
 *
 * @param {{ open: boolean, onClose: () => void, categories?: Array<{ name: string, productCount: number }> }} props
 */
export function MobileDrawer({ open, onClose, categories = [] }) {
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="Close menu"
        tabIndex={-1}
      />

      <aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-fade-in flex-col bg-white shadow-lift dark:bg-canvas-dark">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5 dark:border-ink-800">
          <span className="font-display text-sm font-bold uppercase tracking-[0.28em]">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-label="Close menu"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <SearchBar onNavigate={onClose} className="relative mb-6" />

          <nav className="space-y-1">
            {PRIMARY_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'block rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-white'
                      : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800/60'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {categories.length > 0 && (
            <>
              <p className="mb-3 mt-7 px-4 text-2xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => {
                  const copy = getCategoryCopy(category.name);
                  const Icon = copy.icon;

                  return (
                    <Link
                      key={category.name}
                      to={`/products?category=${encodeURIComponent(category.name)}`}
                      onClick={onClose}
                      className="flex items-center gap-2.5 rounded-2xl border border-ink-100 p-2.5 transition hover:border-ink-200 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-800/60"
                    >
                      <span
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-ink-700 dark:text-ink-100',
                          copy.accent
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{category.name}</span>
                        <span className="block text-[0.7rem] text-ink-500 dark:text-ink-400">
                          {category.productCount} items
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          <p className="mb-3 mt-7 px-4 text-2xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Account
          </p>

          {isAuthenticated ? (
            <div className="space-y-1">
              <p className="truncate px-4 pb-2 text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
              <DrawerLink to="/account/orders" icon={Package} label="My orders" onClick={onClose} />
              <DrawerLink to="/account/profile" icon={UserCircle} label="Profile" onClick={onClose} />
              <DrawerLink to="/wishlist" icon={Heart} label="Wishlist" onClick={onClose} />
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2 px-4">
              <Link
                to="/login"
                onClick={onClose}
                className="block rounded-full bg-ink-950 px-5 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="block rounded-full border border-ink-200 px-5 py-3 text-center text-sm font-semibold dark:border-ink-700"
              >
                Create account
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 dark:border-ink-800">
          <span className="text-xs text-ink-500 dark:text-ink-400">Appearance</span>
          <ThemeToggle />
        </div>
      </aside>
    </div>
  );
}

export default MobileDrawer;
