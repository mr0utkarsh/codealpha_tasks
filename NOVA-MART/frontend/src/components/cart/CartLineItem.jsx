import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { formatCurrency } from '../../lib/format.js';
import QuantityStepper from '../ui/QuantityStepper.jsx';
import ProductImage from '../ui/ProductImage.jsx';
import { Badge } from '../ui/Badge.jsx';
import { MAX_QUANTITY_PER_ITEM } from '../../context/CartContext.jsx';

/**
 * One line of the shopping bag.
 *
 * @param {{ item: object }} props
 */
export function CartLineItem({ item }) {
  const { updateQuantity, removeItem, isMutating } = useCart();
  const { toggle } = useWishlist();

  const { product } = item;
  const isSoldOut = !product.inStock;
  const maxQuantity = Math.min(product.stock || MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM);

  const handleMoveToWishlist = async () => {
    try {
      await removeItem(item);
      await toggle(product.id);
    } catch {
      /* toasts already surfaced */
    }
  };

  return (
    <div className="flex gap-4 py-5">
      <Link to={`/products/${product.slug}`} className="shrink-0">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="size-24 rounded-2xl sm:size-28"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-400">
              {product.brand}
            </p>
            <h3 className="mt-0.5 clamp-2 text-sm font-semibold leading-snug">
              <Link to={`/products/${product.slug}`} className="transition hover:text-brand-700 dark:hover:text-brand-300">
                {product.name}
              </Link>
            </h3>
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
              {formatCurrency(product.price)} each
            </p>
            {isSoldOut && (
              <div className="mt-2">
                <Badge tone="danger">Sold out - remove to continue</Badge>
              </div>
            )}
          </div>

          <p className="shrink-0 font-display text-sm font-bold tabular-nums">
            {formatCurrency(item.lineTotal)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <QuantityStepper
            value={item.quantity}
            min={1}
            max={maxQuantity}
            disabled={isMutating || isSoldOut}
            size="sm"
            onChange={(next) => updateQuantity(item, next).catch(() => {})}
            label={`Quantity for ${product.name}`}
          />

          <button
            type="button"
            onClick={handleMoveToWishlist}
            disabled={isMutating}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink-600 transition hover:bg-ink-100 disabled:opacity-50 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Heart className="size-3.5" aria-hidden="true" />
            Save for later
          </button>

          <button
            type="button"
            onClick={() => removeItem(item).catch(() => {})}
            disabled={isMutating}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartLineItem;
