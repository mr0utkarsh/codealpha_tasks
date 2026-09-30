import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, Sparkles } from 'lucide-react';
import { productsApi } from '../../lib/api.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { cn } from '../../lib/format.js';
import AnnouncementBar from './AnnouncementBar.jsx';
import MegaMenu from './MegaMenu.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import SearchBar from './SearchBar.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import UserMenu from './UserMenu.jsx';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop all', to: '/products' },
  { label: 'New arrivals', to: '/products?sort=newest' },
  { label: 'Under $150', to: '/products?maxPrice=150&sort=price-asc' },
];

const CENTERED_ICON =
  'grid size-10 place-items-center rounded-full text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white';

function navLinkClasses({ isActive }) {
  return cn(
    'rounded-full px-3.5 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-white'
      : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-800/60 dark:hover:text-white'
  );
}

function CountBadge({ value, tone }) {
  if (!value) return null;

  return (
    <span
      key={value}
      className={cn(
        'absolute -right-0.5 -top-0.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full px-1 text-[0.65rem] font-bold text-white animate-pop',
        tone === 'rose' ? 'bg-rose-500' : 'bg-brand-600'
      )}
    >
      {value}
    </span>
  );
}

/**
 * Sticky storefront header: announcement strip, navigation, search, wishlist,
 * bag and account controls. Counts come from the live cart / wishlist contexts.
 */
export function Navbar() {
  const location = useLocation();
  const { isReady } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: categories } = useAsyncData(
    () => productsApi.categories().then((payload) => payload?.data ?? []),
    [],
    { initialData: [] }
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 6);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close every overlay on navigation.
  useEffect(() => {
    setIsMegaOpen(false);
    setIsDrawerOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

  const cartCount = itemCount ?? 0;

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />

      <div
        className={cn(
          'surface-blur border-b transition-shadow duration-300',
          isScrolled ? 'hairline shadow-soft' : 'border-transparent'
        )}
      >
        <div className="container flex h-16 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={cn(CENTERED_ICON, '-ml-2 lg:hidden')}
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <Link to="/" className="flex items-center gap-2.5" aria-label="NOVA MART home">
            <span className="grid size-9 place-items-center rounded-xl bg-ink-950 text-white dark:bg-white dark:text-ink-950">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[0.95rem] font-extrabold uppercase tracking-[0.16em]">
                Nova
              </span>
              <span className="font-display text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-ink-500 dark:text-ink-400">
                Mart
              </span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.label} to={link.to} end={link.to === '/'} className={navLinkClasses}>
                {link.label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={() => setIsMegaOpen((open) => !open)}
              onMouseEnter={() => setIsMegaOpen(true)}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-medium transition',
                isMegaOpen
                  ? 'bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-white'
                  : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-800/60 dark:hover:text-white'
              )}
              aria-expanded={isMegaOpen}
            >
              Categories
            </button>
          </nav>

          <SearchBar className="relative ml-auto hidden max-w-md flex-1 lg:block" />

          <div className="ml-auto flex items-center gap-0.5 lg:ml-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen((open) => !open)}
              className={cn(CENTERED_ICON, 'lg:hidden')}
              aria-label="Search"
            >
              <Search className="size-[1.15rem]" aria-hidden="true" />
            </button>

            <ThemeToggle />

            <Link
              to="/wishlist"
              className={cn(CENTERED_ICON, 'relative hidden sm:grid')}
              aria-label={`Wishlist${wishlistCount ? ` (${wishlistCount} items)` : ''}`}
            >
              <Heart className="size-[1.15rem]" aria-hidden="true" />
              <CountBadge value={wishlistCount} tone="rose" />
            </Link>

            <Link
              to="/cart"
              className={cn(CENTERED_ICON, 'relative')}
              aria-label={`Shopping bag${cartCount ? ` (${cartCount} items)` : ''}`}
            >
              <ShoppingBag className="size-[1.15rem]" aria-hidden="true" />
              <CountBadge value={cartCount} />
            </Link>

            {isReady && <UserMenu />}
          </div>
        </div>

        {isSearchOpen && (
          <div className="container relative pb-4 lg:hidden">
            <SearchBar autoFocus onNavigate={() => setIsSearchOpen(false)} className="relative" />
          </div>
        )}

        {isMegaOpen && (
          <MegaMenu
            categories={categories ?? []}
            onNavigate={() => setIsMegaOpen(false)}
            onClose={() => setIsMegaOpen(false)}
          />
        )}
      </div>

      <MobileDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={categories ?? []}
      />
    </header>
  );
}

export default Navbar;
