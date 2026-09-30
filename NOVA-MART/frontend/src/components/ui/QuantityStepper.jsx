import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/format.js';

/**
 * Quantity selector used on product, cart and checkout screens.
 *
 * @param {{ value: number, onChange: (value: number) => void, min?: number, max?: number, disabled?: boolean, size?: 'sm'|'md', className?: string, label?: string }} props
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  disabled = false,
  size = 'md',
  className,
  label = 'Quantity',
}) {
  const clamp = (next) => Math.max(min, Math.min(next, max));
  const isSmall = size === 'sm';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900',
        isSmall ? 'h-9' : 'h-11',
        className
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        className={cn(
          'grid h-full place-items-center rounded-l-full text-ink-600 transition hover:bg-ink-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-ink-300 dark:hover:bg-ink-800',
          isSmall ? 'w-9' : 'w-11'
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={isSmall ? 'size-3.5' : 'size-4'} aria-hidden="true" />
      </button>

      <span
        className={cn('min-w-8 text-center text-sm font-semibold tabular-nums', isSmall && 'text-xs')}
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        className={cn(
          'grid h-full place-items-center rounded-r-full text-ink-600 transition hover:bg-ink-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-ink-300 dark:hover:bg-ink-800',
          isSmall ? 'w-9' : 'w-11'
        )}
        aria-label="Increase quantity"
        title={value >= max ? `Only ${max} available` : 'Increase quantity'}
      >
        <Plus className={isSmall ? 'size-3.5' : 'size-4'} aria-hidden="true" />
      </button>
    </div>
  );
}

export default QuantityStepper;
