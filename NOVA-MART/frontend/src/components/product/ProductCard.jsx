import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { cn, formatCurrency } from '../../lib/format.js';
import { Badge, DiscountBadge } from '../ui/Badge.jsx';
import ProductImage from '../ui/ProductImage.jsx';
import { StarRating } from '../ui/StarRating.jsx';

/**
 * Catalogue card used on the home page, shop grid, search results and rails.
 *
 * @param {{ product: object, className?: string, priority?: boolean }} props
 */
export function ProductCard({ product, className, priority = false }) {
  const { addItem, isMutating } = useCart();
  const { isSaved, toggle } = useWishlist();

  const saved = isSaved(product.id);
  const isSoldOut = !product.inStock;
  const isLowStock = !isSoldOut && product.stock <= 5;
  const isNew =
    !product.isFeatured &&
    !product.isTrending &&
    Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 30;

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSoldOut) return;
    try {
      await addItem(product, 1);
    } catch {
      /* the cart context already surfaced a toast */
    }
  };

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await toggle(product.id);
    } catch {
      /* handled by the wishlist context */
    }
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-ink-200 hover:shadow-card dark:border-ink-800 dark:bg-ink-900/40 dark:hover:border-ink-700',
        className
      )}
    >
      <Link
        to={`/products/${product.slug}`}
        className="relative block overflow-hidden"
        aria-label={product.name}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="aspect-square w-full"
          imgClassName="transition-transform duration-700 ease-smooth group-hover:scale-[1.06]"
        />

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-2">
          {product.discountPercent && <DiscountBadge percent={product.discountPercent} />}
          {isSoldOut && <Badge tone="neutral">Sold out</Badge>}
          {isLowStock && <Badge tone="warning">Only {product.stock} left</Badge>}
          {isNew && !isSoldOut && <Badge tone="brand">New</Badge>}
          {product.isTrending && !isSoldOut && !product.discountPercent && (
            <Badge tone="neutral">Trending</Badge>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleWishlist}
        className={cn(
          'absolute right-3 top-3 grid size-9 place-items-center rounded-full backdrop-blur transition',
          saved
            ? 'bg-rose-500 text-white'
            : 'bg-white/85 text-ink-600 hover:bg-white hover:text-rose-500 dark:bg-ink-900/80 dark:text-ink-200'
        )}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        aria-pressed={saved}
      >
        <Heart className={cn('size-4', saved && 'fill-current')} aria-hidden="true" />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-400">
          {product.brand}
        </p>

        <h3 className="mt-1.5 clamp-2 text-sm font-semibold leading-snug">
          <Link to={`/products/${product.slug}`} className="transition hover:text-brand-700 dark:hover:text-brand-300">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2">
          <StarRating value={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="font-display text-base font-bold tabular-nums">
              {formatCurrency(product.price)}
            </p>
            {product.comparePrice && (
              <p className="text-xs text-ink-400 line-through tabular-nums">
                {formatCurrency(product.comparePrice)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isSoldOut || isMutating}
            className={cn(
              'grid size-10 place-items-center rounded-full transition',
              isSoldOut
                ? 'cursor-not-allowed bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500'
                : 'bg-ink-950 text-white hover:bg-brand-600 dark:bg-white dark:text-ink-950 dark:hover:bg-brand-500 dark:hover:text-white'
            )}
            aria-label={isSoldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
            title={isSoldOut ? 'Sold out' : 'Add to bag'}
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
