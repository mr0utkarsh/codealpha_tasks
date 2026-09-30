import { CheckCircle2, Lock, ShoppingBag, Truck } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/format.js';
import ProductImage from '../ui/ProductImage.jsx';

/**
 * Free-shipping progress meter used in the bag and in the mini summary.
 *
 * @param {{ summary: object, className?: string }} props
 */
export function FreeShippingProgress({ summary, className }) {
  const threshold = summary?.freeShippingThreshold ?? 0;
  const remaining = summary?.freeShippingRemaining ?? 0;
  const subtotal = summary?.subtotal ?? 0;

  if (!threshold) return null;

  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
  const qualified = summary?.qualifiesForFreeShipping;

  return (
    <div className={cn('rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/50', className)}>
      <p className="flex items-center gap-2 text-xs font-medium text-ink-700 dark:text-ink-200">
        {qualified ? (
          <>
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
            You have unlocked free express shipping
          </>
        ) : (
          <>
            <Truck className="size-4 text-brand-500" aria-hidden="true" />
            Spend {formatCurrency(remaining)} more for free shipping
          </>
        )}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-smooth',
            qualified ? 'bg-emerald-500' : 'bg-brand-500'
          )}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress towards free shipping"
        />
      </div>
    </div>
  );
}

/**
 * Sticky order summary card shared by the bag, checkout and order details.
 *
 * @param {{ summary: object, items?: object[], children?: import('react').ReactNode, title?: string, showItems?: boolean, className?: string }} props
 */
export function OrderSummaryCard({
  summary,
  items = [],
  children,
  title = 'Order summary',
  showItems = false,
  className,
}) {
  return (
    <aside
      className={cn(
        'rounded-3xl border border-ink-100 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900/40',
        className
      )}
    >
      <h2 className="flex items-center gap-2 font-display text-base font-semibold">
        <ShoppingBag className="size-4 text-ink-400" aria-hidden="true" />
        {title}
      </h2>

      {showItems && items.length > 0 && (
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <ProductImage src={item.product.image} alt={item.product.name} className="size-12 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="clamp-1 text-xs font-medium">{item.product.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">Qty {item.quantity}</p>
              </div>
              <p className="text-xs font-semibold tabular-nums">{formatCurrency(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-5 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-ink-600 dark:text-ink-300">Subtotal</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(summary?.subtotal ?? 0)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-600 dark:text-ink-300">Shipping</dt>
          <dd className="font-medium tabular-nums">
            {summary?.shippingFee ? formatCurrency(summary.shippingFee) : 'Free'}
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display text-lg font-bold tabular-nums">
            {formatCurrency(summary?.total ?? 0)}
          </dd>
        </div>
      </dl>

      {children && <div className="mt-5 space-y-3">{children}</div>}

      <ul className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400">
        <li className="flex items-center gap-2">
          <Lock className="size-3.5" aria-hidden="true" />
          Secure, encrypted checkout
        </li>
        <li className="flex items-center gap-2">
          <Truck className="size-3.5" aria-hidden="true" />
          Dispatched within 24 hours
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          30-day free returns
        </li>
      </ul>
    </aside>
  );
}

export default OrderSummaryCard;
