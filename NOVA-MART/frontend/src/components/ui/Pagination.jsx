import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/format.js';

/**
 * Builds a compact page list: 1 … 4 5 6 … 12
 *
 * @param {number} current
 * @param {number} total
 */
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const list = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const withGaps = [];
  list.forEach((page, index) => {
    if (index > 0 && page - list[index - 1] > 1) withGaps.push('gap');
    withGaps.push(page);
  });

  return withGaps;
}

/**
 * @param {{ page: number, totalPages: number, onChange: (page: number) => void, className?: string }} props
 */
export function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  const buttonClasses =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition disabled:opacity-40';

  return (
    <nav className={cn('flex items-center justify-center gap-2', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          buttonClasses,
          'border-ink-200 bg-white hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:hover:bg-ink-800'
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {pages.map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-ink-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              buttonClasses,
              entry === page
                ? 'border-transparent bg-ink-950 text-white dark:bg-white dark:text-ink-950'
                : 'border-ink-200 bg-white hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:hover:bg-ink-800'
            )}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          buttonClasses,
          'border-ink-200 bg-white hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:hover:bg-ink-800'
        )}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

export default Pagination;
