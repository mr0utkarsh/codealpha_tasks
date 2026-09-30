import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, MapPin, Package, Truck } from 'lucide-react';
import { ordersApi } from '../lib/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { estimateDelivery, formatCurrency, formatDateTime } from '../lib/format.js';
import { ButtonLink } from '../components/ui/Button.jsx';
import { ErrorState, PageLoader } from '../components/ui/Feedback.jsx';
import { StatusPill } from '../components/ui/Badge.jsx';
import ProductImage from '../components/ui/ProductImage.jsx';

/**
 * Order confirmation. The order passed from checkout (location.state) is used
 * instantly; the API is the fallback when the page is refreshed directly.
 */
export function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const passedOrder = location.state?.order ?? null;

  const state = useAsyncData(
    ({ signal }) =>
      passedOrder
        ? Promise.resolve(passedOrder)
        : ordersApi
            .detail(orderId, { signal })
            // The API wraps the detail payload: { success, data: { order } }.
            .then((payload) => payload?.data?.order ?? payload?.data ?? null),
    [orderId, Boolean(passedOrder)],
    { initialData: passedOrder }
  );

  const order = state.data;

  if (!order) {
    if (state.error) return <div className="container py-16"><ErrorState error={state.error} onRetry={state.refetch} /></div>;
    return <PageLoader label="Loading your order…" />;
  }

  const address = order.shippingAddress;

  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 animate-pop">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>

        <p className="mt-6 text-2xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
          Order confirmed
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold">Thank you - it is on its way.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">
          We sent a confirmation to {address?.email}. You can follow every step from your orders
          page, and we will email you again when it ships.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="rounded-full border border-ink-200 bg-white px-4 py-2 font-medium dark:border-ink-700 dark:bg-ink-900">
            {order.orderNumber}
          </span>
          <StatusPill status={order.status} label={order.statusLabel} />
          <span className="text-ink-500 dark:text-ink-400">
            Placed {formatDateTime(order.createdAt)}
          </span>
        </div>
      </div>

      <section className="mt-10 rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <Package className="size-4 text-ink-400" aria-hidden="true" />
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </h2>
          <p className="font-display text-lg font-bold tabular-nums">{formatCurrency(order.totalAmount)}</p>
        </div>

        <ul className="mt-5 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <ProductImage src={item.image} alt={item.name} className="size-14 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="clamp-1 text-sm font-medium">{item.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">Qty {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-sm dark:border-ink-800">
          <div className="flex justify-between">
            <dt className="text-ink-600 dark:text-ink-300">Subtotal</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600 dark:text-ink-300">Shipping</dt>
            <dd className="font-medium tabular-nums">
              {order.shippingFee ? formatCurrency(order.shippingFee) : 'Free'}
            </dd>
          </div>
          <div className="flex justify-between border-t border-ink-100 pt-2 dark:border-ink-800">
            <dt className="font-semibold">Total</dt>
            <dd className="font-display font-bold tabular-nums">{formatCurrency(order.totalAmount)}</dd>
          </div>
        </dl>
      </section>


      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900/40">
          <Truck className="size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <p className="mt-3 text-xs text-ink-400">Estimated delivery</p>
          <p className="mt-1 text-sm font-semibold">{estimateDelivery(order.createdAt, 3, 6)}</p>
        </div>

        <div className="rounded-3xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900/40">
          <MapPin className="size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <p className="mt-3 text-xs text-ink-400">Shipping to</p>
          <p className="mt-1 text-sm font-semibold">
            {address?.fullName}
            <br />
            {address?.addressLine1}, {address?.city}
          </p>
        </div>

        <div className="rounded-3xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900/40">
          <CreditCard className="size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <p className="mt-3 text-xs text-ink-400">Payment</p>
          <p className="mt-1 text-sm font-semibold">{order.paymentMethod}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400">Status: {order.paymentStatus}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/account/orders" size="lg">
          Track your order
        </ButtonLink>
        <ButtonLink to="/products" variant="secondary" size="lg">
          Continue shopping
        </ButtonLink>
      </div>

      <p className="mt-6 text-center text-xs text-ink-500 dark:text-ink-400">
        Questions about your order?{' '}
        <Link to="/account" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Manage your account
        </Link>{' '}
        or reply to your confirmation email.
      </p>
    </div>
  );
}

export default OrderSuccessPage;
