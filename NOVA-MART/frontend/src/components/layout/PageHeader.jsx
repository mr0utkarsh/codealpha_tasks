import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/format.js';

/**
 * Page title block with an optional breadcrumb trail and actions slot.
 *
 * @param {{ title: string, description?: string, breadcrumbs?: Array<{ label: string, to?: string }>, actions?: import('react').ReactNode, className?: string }} props
 */
export function PageHeader({ title, description, breadcrumbs, actions, className }) {
  return (
    <div className={cn('border-b border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-950/30', className)}>
      <div className="container py-8 sm:py-10">
        {breadcrumbs?.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {crumb.to ? (
                    <Link to={crumb.to} className="transition hover:text-ink-900 dark:hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-ink-800 dark:text-ink-100">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="size-3 text-ink-300 dark:text-ink-600" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-balance text-2xl font-bold sm:text-3xl lg:text-4xl">{title}</h1>
            {description && (
              <p className="mt-3 text-pretty text-sm leading-relaxed text-ink-600 dark:text-ink-300 sm:text-base">
                {description}
              </p>
            )}
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
