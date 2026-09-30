import { Star } from 'lucide-react';
import { cn } from '../../lib/format.js';

/**
 * Read-only star rating with an optional value and review count.
 *
 * @param {{ value: number, reviewCount?: number, size?: 'sm'|'md'|'lg', showValue?: boolean, className?: string }} props
 */
export function StarRating({ value = 0, reviewCount, size = 'sm', showValue = true, className }) {
  const rounded = Math.round((value ?? 0) * 2) / 2;
  const dimension = size === 'lg' ? 'size-5' : size === 'md' ? 'size-4' : 'size-3.5';

  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-label={`Rated ${value} out of 5`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rounded >= star;
          const half = !filled && rounded >= star - 0.5;

          return (
            <span key={star} className="relative inline-flex">
              <Star
                className={cn(dimension, 'text-ink-300 dark:text-ink-600')}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? '50%' : '100%' }}
                  aria-hidden="true"
                >
                  <Star className={cn(dimension, 'fill-amber-400 text-amber-400')} strokeWidth={1.5} />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showValue && (
        <span className="text-xs font-medium text-ink-600 dark:text-ink-300">
          {Number(value ?? 0).toFixed(1)}
          {reviewCount !== undefined && (
            <span className="ml-1 font-normal text-ink-400 dark:text-ink-500">
              ({reviewCount.toLocaleString('en-US')})
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export default StarRating;
