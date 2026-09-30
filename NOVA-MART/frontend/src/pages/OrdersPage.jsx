import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, PackageSearch, Receipt } from 'lucide-react';
import { ordersApi } from '../lib/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatDateTime } from '../lib/format.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import AccountNav from '../components/layout/AccountNav.jsx';
import Button, { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { StatusPill } from '../components/ui/Badge.jsx';
import ProductImage from '../components/ui/ProductImage.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';

const STATUS_FILTERS = ['', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

/** Order history with status filters and in-place cancellation. */
export function OrdersPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [pendingCancel, setPendingCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const state = useAsyncData(
    ({ signal }) =>
      ordersApi
        .list({ ...(status ? { status } : {}), limit: 20 }, { signal })
        .then((payload) => ({ items: payload?.data ?? [], meta: payload?.meta ?? null })),
    [status],
    { initialData: { items: [], meta: null } }
  );

  const handleCancel = async () => {
    if (!pendingCancel) return;
    setIsCancelling(true);

    try {
      await ordersApi.cancel(pendingCancel.id);
      toast.success('Your order has been cancelled.');
      setPendingCancel(null);
      state.refetch();
    } catch (requestError) {
      toast.error(requestError.message || 'We could not cancel that order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const orders = state.data?.items ?? [];


  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Account', to: '/account' },
          { label: 'Orders' },
        ]}
        title="Your orders"
        description="Track deliveries, download receipts for your records or cancel anything still pending."
      />

      <div className="container grid gap-8 py-10 lg:grid-cols-[14rem_1fr] lg:gap-12">
        <AccountNav className="lg:sticky lg:top-28 lg:h-fit" />

        <div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((value) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => setStatus(value)}
                className={
                  status === value
                    ? 'rounded-full bg-ink-950 px-4 py-2 text-xs font-semibold text-white transition dark:bg-white dark:text-ink-950'
                    : 'rounded-full border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-600 transition hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
                }
              >
                {value ? value.charAt(0) + value.slice(1).toLowerCase() : 'All'}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {state.error ? (
              <ErrorState error={state.error} onRetry={state.refetch} />
            ) : state.isLoading && orders.length === 0 ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="mt-4 h-3.5 w-2/3 rounded-full" />
                </div>
              ))
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={status ? `No ${status.toLowerCase()} orders` : 'No orders yet'}
                description={
                  status
                    ? 'Try another status, or clear the filter to see everything.'
                    : 'When you place your first order it will show up here with live tracking.'
                }
                action={
                  status ? (
                    <Button variant="secondary" onClick={() => setStatus('')}>
                      Show all orders
                    </Button>
                  ) : (
                    <ButtonLink to="/products">Start shopping</ButtonLink>
                  )
                }
              />
            ) : (

              orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-3xl border border-ink-100 bg-white p-5 sm:p-6 dark:border-ink-800 dark:bg-ink-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-semibold">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                        {formatDateTime(order.createdAt)} · {order.itemCount}{' '}
                        {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={order.status} label={order.statusLabel} />
                      <p className="font-display text-base font-bold tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-4 flex flex-wrap gap-3">
                    {order.items.slice(0, 4).map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          className="size-10 rounded-lg"
                        />
                        <span className="max-w-40 truncate text-xs text-ink-600 dark:text-ink-300">
                          {item.name} × {item.quantity}
                        </span>
                      </li>
                    ))}
                    {order.items.length > 4 && (
                      <li className="self-center text-xs text-ink-400">
                        +{order.items.length - 4} more
                      </li>
                    )}
                  </ul>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4 dark:border-ink-800">
                    <ButtonLink to={`/orders/${order.id}/success`} size="sm" variant="secondary">
                      View details
                    </ButtonLink>
                    {order.status === 'PENDING' && (
                      <Button size="sm" variant="danger-ghost" onClick={() => setPendingCancel(order)}>
                        <Ban className="size-3.5" aria-hidden="true" />
                        Cancel order
                      </Button>
                    )}
                    <Link
                      to="/products"
                      className="text-xs font-medium text-brand-600 transition hover:underline dark:text-brand-400"
                    >
                      Reorder similar
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title={`Cancel ${pendingCancel?.orderNumber ?? 'this order'}?`}
        description="Pending orders can be cancelled free of charge. Anything already dispatched cannot be stopped."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        tone="danger"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onClose={() => setPendingCancel(null)}
      />
    </>
  );
}

export default OrdersPage;
