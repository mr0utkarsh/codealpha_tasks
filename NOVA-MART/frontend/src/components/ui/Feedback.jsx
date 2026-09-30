import { AlertTriangle, Loader2, PackageOpen, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '../../lib/format.js';

const TONES = {
  neutral: 'border-ink-200 bg-ink-50 text-ink-700 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-200',
  brand: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  danger: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
};

/** Inline contextual message. */
export function InlineAlert({ tone = 'neutral', icon: Icon, title, children, className }) {
  return (
    <div
      className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm', TONES[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}

/** Centered spinner for whole page loads. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-500 dark:text-ink-400">
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden="true" />;
}

/** Empty state with an optional call to action. */
export function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 px-6 py-14 text-center dark:border-ink-700',
        className
      )}
    >
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600 dark:text-ink-300">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * Error state with a retry affordance. Distinguishes network failures from
 * server errors so the copy stays helpful.
 */
export function ErrorState({ error, onRetry, title = 'Something went wrong', className }) {
  const isNetwork = error?.isNetworkError || error?.status === 0;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/60 px-6 py-14 text-center dark:border-rose-500/30 dark:bg-rose-500/5',
        className
      )}
    >
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
        {isNetwork ? <WifiOff className="size-6" aria-hidden="true" /> : <AlertTriangle className="size-6" aria-hidden="true" />}
      </span>
      <h3 className="font-display text-lg font-semibold">
        {isNetwork ? 'Cannot reach the store' : title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600 dark:text-ink-300">
        {error?.message || 'Please try again in a moment.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-5 text-sm font-medium transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:hover:bg-ink-800"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}

export default EmptyState;
