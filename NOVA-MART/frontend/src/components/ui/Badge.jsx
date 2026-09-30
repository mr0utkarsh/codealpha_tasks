import { cn } from '../../lib/format.js';

const TONES = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  dark: 'bg-ink-950 text-white dark:bg-white dark:text-ink-950',
};

export function Badge({ tone = 'neutral', className, children, icon: Icon }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider',
        TONES[tone] ?? TONES.neutral,
        className
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Maps an order status to a consistent label + colour. */
const ORDER_STATUS_TONES = {
  PENDING: 'warning',
  PROCESSING: 'brand',
  SHIPPED: 'brand',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

const PAYMENT_STATUS_TONES = {
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  REFUNDED: 'neutral',
};

export function StatusPill({ status, label, className }) {
  return (
    <Badge tone={ORDER_STATUS_TONES[status] ?? 'neutral'} className={className}>
      {label ?? status}
    </Badge>
  );
}

export function PaymentPill({ status, className }) {
  return (
    <Badge tone={PAYMENT_STATUS_TONES[status] ?? 'neutral'} className={className}>
      {status}
    </Badge>
  );
}

/** "-18%" style savings chip. */
export function DiscountBadge({ percent, className }) {
  if (!percent) return null;
  return (
    <Badge tone="dark" className={cn('tracking-normal', className)}>
      -{percent}%
    </Badge>
  );
}

export default Badge;
