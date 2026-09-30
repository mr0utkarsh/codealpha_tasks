import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getCategoryCopy } from '../../data/categoryCopy.js';
import { cn } from '../../lib/format.js';

/**
 * Category panel shown under the "Shop" trigger on desktop.
 *
 * @param {{ categories: Array<{name: string, productCount: number, image: string|null}>, onNavigate: () => void, className?: string }} props
 */
export function MegaMenu({ categories, onNavigate, className }) {
  const featured = categories.slice(0, 8);

  return (
    <div
      className={cn(
        'absolute inset-x-0 top-full z-40 border-b border-ink-100 bg-white shadow-lift animate-fade-up dark:border-ink-800 dark:bg-ink-900',
        className
      )}
    >
      <div className="container grid gap-8 py-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="mb-4 text-2xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Browse the catalogue
          </p>
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {featured.map((category) => {
              const copy = getCategoryCopy(category.name);
              const Icon = copy.icon;

              return (
                <Link
                  key={category.name}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  onClick={onNavigate}
                  className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-ink-50 dark:hover:bg-ink-800/60"
                >
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-ink-700 dark:text-ink-100',
                      copy.accent
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900 group-hover:text-brand-700 dark:text-ink-50 dark:group-hover:text-brand-300">
                      {category.name}
                    </span>
                    <span className="block truncate text-xs text-ink-500 dark:text-ink-400">
                      {copy.tagline}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-ink-400">{category.productCount}</span>
                </Link>
              );
            })}
          </div>

          <Link
            to="/products"
            onClick={onNavigate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-4 py-2 text-xs font-semibold text-ink-800 transition hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-700"
          >
            Shop everything
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {categories[0]?.image && (
          <Link
            to="/products?featured=true"
            onClick={onNavigate}
            className="group relative hidden overflow-hidden rounded-3xl lg:block"
          >
            <img
              src={categories[0].image}
              alt="Featured products"
              loading="lazy"
              className="size-full min-h-48 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Editor's picks
              </span>
              <span className="mt-1 block font-display text-lg font-semibold">Featured this week</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                Hand-picked by the NOVA team
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default MegaMenu;
