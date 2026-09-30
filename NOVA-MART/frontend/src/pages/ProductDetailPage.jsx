import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  Heart,
  PackageCheck,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { productsApi } from '../lib/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { useCart, MAX_QUANTITY_PER_ITEM } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { estimateDelivery, formatCurrency } from '../lib/format.js';
import { Badge, DiscountBadge } from '../components/ui/Badge.jsx';
import Button, { ButtonLink } from '../components/ui/Button.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import { StarRating } from '../components/ui/StarRating.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import { EmptyState, ErrorState, InlineAlert } from '../components/ui/Feedback.jsx';
import { ProductGallery } from '../components/product/ProductGallery.jsx';
import { ProductGrid } from '../components/product/ProductGrid.jsx';

/**
 * Purchase column: pricing, stock, quantity and the bag / wishlist actions.
 *
 * @param {{ product: object, quantity: number, onQuantityChange: (value: number) => void }} props
 */
function PurchasePanel({ product, quantity, onQuantityChange }) {
  const { addItem, isMutating } = useCart();
  const { isSaved, toggle } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();

  const saved = isSaved(product.id);
  const isSoldOut = !product.inStock;
  const maxQuantity = Math.min(product.stock || MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM);

  const handleAdd = async () => {
    try {
      await addItem(product, quantity);
    } catch {
      /* the cart context already surfaced the error */
    }
  };

  const handleBuyNow = async () => {
    try {
      await addItem(product, quantity);
      navigate('/checkout');
    } catch {
      /* the cart context already surfaced the error */
    }
  };

  const handleWishlist = async () => {
    try {
      await toggle(product.id);
    } catch {
      /* handled by the wishlist context */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <p className="font-display text-3xl font-bold tabular-nums">{formatCurrency(product.price)}</p>
        {product.comparePrice > product.price && (
          <p className="pb-1 text-base text-ink-400 line-through">
            {formatCurrency(product.comparePrice)}
          </p>
        )}
        {product.discountPercent ? <DiscountBadge percent={product.discountPercent} className="mb-1.5" /> : null}
      </div>

      <p className="flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
        {isSoldOut ? (
          <Badge tone="danger">Sold out</Badge>
        ) : product.stock <= 5 ? (
          <Badge tone="warning">Only {product.stock} left in stock</Badge>
        ) : (
          <Badge tone="success" icon={Check}>
            In stock - ships today
          </Badge>
        )}
        <span>Free returns for 30 days</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={onQuantityChange}
          max={maxQuantity}
          disabled={isSoldOut}
        />

        <Button
          size="lg"
          className="flex-1 min-w-44"
          onClick={handleAdd}
          isLoading={isMutating}
          disabled={isSoldOut}

        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          Add to bag
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={handleWishlist}
          disabled={isSoldOut}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={saved ? 'size-4 fill-rose-500 text-rose-500' : 'size-4'} aria-hidden="true" />
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>

      <Button variant="brand" size="lg" fullWidth onClick={handleBuyNow} disabled={isSoldOut}>
        Buy it now
      </Button>

      {isSoldOut && (
        <InlineAlert tone="warning" title="This piece is out of stock">
          Save it to your wishlist and we will keep it on your radar.
        </InlineAlert>
      )}

      <ul className="grid gap-3 rounded-3xl border border-ink-100 bg-white p-5 text-sm dark:border-ink-800 dark:bg-ink-900/40">
        {[
          { icon: Truck, copy: `Free express shipping - arrives ${estimateDelivery(Date.now(), 3, 6)}` },
          { icon: RotateCcw, copy: 'Free 30-day returns, no questions asked' },
          { icon: ShieldCheck, copy: '2-year warranty covered by NOVA MART' },
          { icon: PackageCheck, copy: 'Authenticity checked before it leaves the warehouse' },
        ].map(({ icon: Icon, copy }) => (
          <li key={copy} className="flex items-start gap-3 text-ink-600 dark:text-ink-300">
            <Icon className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            {copy}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mirrors the real layout while the product is loading. */
function DetailSkeleton() {
  return (
    <div className="container grid gap-10 py-10 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="space-y-5">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-9 w-3/4 rounded-2xl" />
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-10 w-48 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-2/3 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Full product page: gallery, purchase panel, details and related pieces. */
export function ProductDetailPage() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);

  const state = useAsyncData(
    ({ signal }) =>
      productsApi
        .detail(slug, { signal })
        // The API wraps the detail payload: { success, data: { product, related } }.
        .then((payload) => payload?.data?.product ?? null),
    [slug],
    { initialData: null }
  );
  const product = state.data;

  const related = useAsyncData(
    ({ signal }) =>
      product
        ? productsApi
            .list({ category: product.category, sort: 'popularity', limit: 7 }, { signal })
            .then((payload) =>
              (payload?.data ?? []).filter((item) => item.id !== product.id).slice(0, 6)
            )
        : Promise.resolve([]),
    [product?.id],
    { initialData: [] }
  );

  if (state.isLoading && !product) return <DetailSkeleton />;

  if (state.error) {
    const notFound = state.error.status === 404;

    return (
      <div className="container py-16">
        {notFound ? (
          <EmptyState
            icon={PackageSearch}
            title="We could not find that product"
            description="It may have been removed, or the link you followed is out of date."
            action={
              <ButtonLink to="/products" variant="secondary">
                Browse the catalogue
              </ButtonLink>
            }
          />
        ) : (
          <ErrorState error={state.error} onRetry={state.refetch} />
        )}
      </div>
    );
  }

  if (!product) return null;

  const categoryHref = `/products?category=${encodeURIComponent(product.category)}`;

  return (
    <div className="container py-8 lg:py-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400"
      >
        <Link to="/" className="transition hover:text-ink-900 dark:hover:text-white">
          Home
        </Link>
        <ChevronRight className="size-3 text-ink-300 dark:text-ink-600" aria-hidden="true" />
        <Link to="/products" className="transition hover:text-ink-900 dark:hover:text-white">
          Shop
        </Link>
        <ChevronRight className="size-3 text-ink-300 dark:text-ink-600" aria-hidden="true" />
        <Link to={categoryHref} className="transition hover:text-ink-900 dark:hover:text-white">
          {product.category}
        </Link>
        <ChevronRight className="size-3 text-ink-300 dark:text-ink-600" aria-hidden="true" />
        <span className="font-medium text-ink-800 dark:text-ink-100">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <ProductGallery
          images={product.images}
          name={product.name}
          className="lg:sticky lg:top-24 lg:h-fit"
        />

        <div className="space-y-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={categoryHref}
                className="text-2xs font-semibold uppercase tracking-[0.16em] text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
              >
                {product.brand}
              </Link>
              <span className="text-ink-300 dark:text-ink-600">·</span>
              <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                {product.category}
              </span>
            </div>

            <h1 className="mt-3 text-balance text-2xl font-bold sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StarRating value={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-xs text-ink-400">SKU {product.slug}</span>
            </div>
          </div>

          <PurchasePanel product={product} quantity={quantity} onQuantityChange={setQuantity} />

          <section className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40">
            <h2 className="font-display text-base font-semibold">About this piece</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {product.description}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-100 pt-5 text-sm dark:border-ink-800">
              <div>
                <dt className="text-xs text-ink-400">Brand</dt>
                <dd className="mt-1 font-medium">{product.brand}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Category</dt>
                <dd className="mt-1 font-medium">{product.category}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Availability</dt>
                <dd className="mt-1 font-medium">
                  {product.inStock ? `${product.stock} in stock` : 'Out of stock'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Reviews</dt>
                <dd className="mt-1 font-medium">{product.reviewCount.toLocaleString('en-US')}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>


      <section className="mt-16 lg:mt-20">
        <SectionHeading
          eyebrow="You may also like"
          title={`More from ${product.category}`}
          action={{ label: 'Browse the category', to: categoryHref }}
        />
        <div className="mt-8">
          <ProductGrid
            products={related.data ?? []}
            isLoading={related.isLoading}
            skeletonCount={6}
            columns="md"
          />
        </div>
      </section>
    </div>
  );
}

export default ProductDetailPage;

