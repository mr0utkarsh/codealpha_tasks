import { useEffect, useState } from 'react';
import { SlidersHorizontal, Star, Tag, X } from 'lucide-react';
import { cn } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import { Select } from '../ui/Field.jsx';

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'popularity', label: 'Most reviewed' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

const PRICE_BANDS = [
  { label: 'Under $50', min: undefined, max: 50 },
  { label: '$50 - $150', min: 50, max: 150 },
  { label: '$150 - $500', min: 150, max: 500 },
  { label: '$500 - $1500', min: 500, max: 1500 },
  { label: '$1500+', min: 1500, max: undefined },
];

const MIN_RATINGS = [4.5, 4, 3.5];

/**
 * Catalogue filter sidebar + toolbar. State lives in the URL (see the products
 * page) so filtered views are shareable.
 *
 * @param {{ categories?: object[], filters: object, onChange: (patch: object) => void, onReset: () => void, resultCount?: number, showMobileToggle?: boolean }} props
 */
export function ProductFilters({
  categories = [],
  filters,
  onChange,
  onReset,
  resultCount,
  showMobileToggle = true,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  const activeCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.featured,
    filters.minRating,
  ].filter(Boolean).length;

  const panel = (
    <FilterPanel
      categories={categories}
      filters={filters}
      onChange={onChange}
      onReset={onReset}
      resultCount={resultCount}
    />
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {resultCount === undefined ? 'Loading products…' : `${resultCount} products`}
        </p>

        <div className="flex items-center gap-2">
          {showMobileToggle && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
              {activeCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-ink-950 text-[0.65rem] font-bold text-white dark:bg-white dark:text-ink-950">
                  {activeCount}
                </span>
              )}
            </Button>
          )}

          <Select
            aria-label="Sort products"
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value, page: 1 })}
            className="h-10 min-w-44 text-sm"
            containerClassName="w-auto"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="hidden lg:block">{panel}</div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-ink-950/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close filters"
            tabIndex={-1}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-4xl border-t border-ink-100 bg-white p-5 shadow-lift animate-fade-up dark:border-ink-800 dark:bg-canvas-dark">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="grid size-9 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
                aria-label="Close filters"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {panel}

            <Button fullWidth className="mt-5" onClick={() => setIsMobileOpen(false)}>
              Show {resultCount ?? 0} products
            </Button>
          </div>
        </div>
      )}
    </>
  );
}


function FilterPanel({ categories, filters, onChange, onReset, resultCount }) {
  return (
    <div className="space-y-7">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
          <Tag className="size-3.5" aria-hidden="true" />
          Category
        </h3>
        <ul className="space-y-1">
          <li>
            <FilterButton active={!filters.category} onClick={() => onChange({ category: '', page: 1 })}>
              All categories
            </FilterButton>
          </li>
          {categories.map((category) => (
            <li key={category.name}>
              <FilterButton
                active={filters.category === category.name}
                onClick={() => onChange({ category: category.name, page: 1 })}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs text-ink-400">{category.productCount}</span>
                </span>
              </FilterButton>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">Price</h3>
        <ul className="space-y-1">
          <li>
            <FilterButton
              active={filters.minPrice === undefined && filters.maxPrice === undefined}
              onClick={() => onChange({ minPrice: undefined, maxPrice: undefined, page: 1 })}
            >
              Any price
            </FilterButton>
          </li>
          {PRICE_BANDS.map((band) => (
            <li key={band.label}>
              <FilterButton
                active={filters.minPrice === band.min && filters.maxPrice === band.max}
                onClick={() => onChange({ minPrice: band.min, maxPrice: band.max, page: 1 })}
              >
                {band.label}
              </FilterButton>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
          <Star className="size-3.5" aria-hidden="true" />
          Rating
        </h3>
        <ul className="space-y-1">
          <li>
            <FilterButton
              active={!filters.minRating}
              onClick={() => onChange({ minRating: undefined, page: 1 })}
            >
              Any rating
            </FilterButton>
          </li>
          {MIN_RATINGS.map((rating) => (
            <li key={rating}>
              <FilterButton
                active={filters.minRating === rating}
                onClick={() => onChange({ minRating: rating, page: 1 })}
              >
                {rating} stars &amp; up
              </FilterButton>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">Availability</h3>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-700 dark:text-ink-200">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(event) => onChange({ inStock: event.target.checked || undefined, page: 1 })}
            className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/30 dark:border-ink-600"
          />
          In stock only
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-700 dark:text-ink-200">
          <input
            type="checkbox"
            checked={Boolean(filters.featured)}
            onChange={(event) => onChange({ featured: event.target.checked || undefined, page: 1 })}
            className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/30 dark:border-ink-600"
          />
          Editor&apos;s picks
        </label>
      </section>

      <Button variant="ghost" size="sm" fullWidth onClick={onReset}>
        <X className="size-3.5" aria-hidden="true" />
        Clear all filters
      </Button>

      {resultCount !== undefined && (
        <p className="text-center text-xs text-ink-400">{resultCount} products match</p>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl px-3 py-2 text-left text-sm transition',
        active
          ? 'bg-ink-950 font-medium text-white dark:bg-white dark:text-ink-950'
          : 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800/70'
      )}
    >
      {children}
    </button>
  );
}

export default ProductFilters;
