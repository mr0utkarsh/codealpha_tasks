import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/format.js';

/**
 * Section header used across the storefront: eyebrow, title, description and an
 * optional action link.
 *
 * @param {{ eyebrow?: string, title: string, description?: string, action?: { label: string, to: string }, align?: 'left'|'center', className?: string }} props
 */
export function SectionHeading({ eyebrow, title, description, action, align = 'left', className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
        {eyebrow && (
          <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-balance text-2xl font-bold sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 text-pretty text-sm leading-relaxed text-ink-600 dark:text-ink-300 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          to={action.to}
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ink-900 transition hover:text-brand-600 dark:text-ink-100 dark:hover:text-brand-400"
        >
          {action.label}
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}

export default SectionHeading;
