import { useState } from 'react';
import { Lock, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../lib/format.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import Button, { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { CartLineItem } from '../components/cart/CartLineItem.jsx';
import { OrderSummaryCard } from '../components/cart/OrderSummaryCard.jsx';

/**
 * Shopping bag: editable line items next to a sticky order summary.
 */
export function CartPage() {
  const { items, summary, clearCart, isLoading, isMutating, error, refresh } = useCart();
  const [isClearOpen, setIsClearOpen] = useState(false);

  const handleClear = async () => {
    try {
      await clearCart();
      setIsClearOpen(false);
    } catch {
      /* the cart context already surfaced the error */
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Bag' }]}
        title="Your bag"
        description={
          items.length
            ? `${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'} ready to check out.`
            : 'Nothing here yet - the catalogue is a good place to start.'
        }
        actions={
          items.length > 0 ? (
            <Button variant="danger-ghost" onClick={() => setIsClearOpen(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Empty bag
            </Button>
          ) : null
        }
      />

      <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_23rem] lg:gap-12">
        <div>
          {error ? (
            <ErrorState error={error} onRetry={refresh} />
          ) : isLoading ? (
            <div className="space-y-4 rounded-3xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900/40">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-4 py-2">
                  <Skeleton className="size-24 rounded-2xl" />
                  <div className="flex-1 space-y-3 py-1">
                    <Skeleton className="h-4 w-2/3 rounded-full" />
                    <Skeleton className="h-3.5 w-1/3 rounded-full" />
                    <Skeleton className="h-9 w-32 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Your bag is empty"
              description="Browse the catalogue and add something you love - we will keep it here until you decide."
              action={<ButtonLink to="/products" size="lg">Start shopping</ButtonLink>}
            />
          ) : (
            <div className="divide-y divide-ink-100 rounded-3xl border border-ink-100 bg-white px-5 dark:divide-ink-800 dark:border-ink-800 dark:bg-ink-900/40">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-28 lg:h-fit">
          <OrderSummaryCard summary={summary} items={items}>
            <div className="mt-5 space-y-3">
              <ButtonLink to="/checkout" size="lg" fullWidth disabled={!items.length}>
                Checkout · {formatCurrency(summary.total)}
              </ButtonLink>
              <ButtonLink to="/products" variant="secondary" fullWidth>
                Continue shopping
              </ButtonLink>
            </div>

            <ul className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400">
              <li className="flex items-center gap-2">
                <Truck className="size-3.5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                Free express shipping over {formatCurrency(summary.freeShippingThreshold ?? 150)}
              </li>
              <li className="flex items-center gap-2">
                <Lock className="size-3.5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                Secure checkout - your data stays yours
              </li>
            </ul>
          </OrderSummaryCard>
        </div>
      </div>

      <ConfirmDialog
        open={isClearOpen}
        title="Empty your bag?"
        description={`This removes all ${summary.itemCount} items from your bag. Saved items in your wishlist stay untouched.`}
        confirmLabel="Empty bag"
        cancelLabel="Keep my bag"
        tone="danger"
        isLoading={isMutating}
        onConfirm={handleClear}
        onClose={() => setIsClearOpen(false)}
      />
    </>
  );
}

export default CartPage;
