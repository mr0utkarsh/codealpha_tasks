import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { compactNumber, formatCurrency } from '../../lib/format.js';
import { ButtonLink } from '../ui/Button.jsx';
import ProductImage from '../ui/ProductImage.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

function HeroTile({ product, aspect, priority = false }) {
  if (!product) return <Skeleton className={`${aspect} w-full rounded-3xl`} />;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="block overflow-hidden rounded-3xl border border-ink-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-card dark:border-ink-800 dark:bg-ink-900"
    >
      <ProductImage
        src={product.image}
        alt={product.name}
        loading="eager"
        fetchPriority={priority ? 'high' : 'auto'}
        className={`${aspect} w-full`}
      />
    </Link>
  );
}

/**
 * Above-the-fold hero: headline, calls to action, live catalogue stats and an
 * image collage built from the featured products.
 *
 * @param {{ summary: object|null, products: object[] }} props
 */
export function HeroSection({ summary, products = [] }) {
  const [first, second, third] = products;

  return (
    <section className="relative overflow-hidden border-b border-ink-100 dark:border-ink-800">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-brand-500/10 blur-3xl"
      />

      <div className="container relative grid gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">
            <Sparkles className="size-3.5 text-brand-500" aria-hidden="true" />
            New season drop · 2026
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Everyday objects,
            <br />
            chosen with intent.
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-ink-600 dark:text-ink-300">
            A short list of things worth owning - considered tech, honest timepieces, sneakers you
            will actually wear and pieces that make a room feel finished.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/products" size="lg">
              Shop the collection
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink to="/products?maxPrice=150&sort=price-asc" variant="secondary" size="lg">
              Explore under $150
            </ButtonLink>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-100 pt-6 dark:border-ink-800">
            <div>
              <dt className="text-xs text-ink-500 dark:text-ink-400">Average rating</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-display text-xl font-bold">
                {summary?.averageRating ?? '4.6'}
                <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500 dark:text-ink-400">Reviews</dt>
              <dd className="mt-1 font-display text-xl font-bold">
                {compactNumber(summary?.reviewCount ?? 8000)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500 dark:text-ink-400">Products</dt>
              <dd className="mt-1 font-display text-xl font-bold">{summary?.productCount ?? 53}</dd>
            </div>
          </dl>
        </div>

        <div className="relative animate-fade-up animate-delay-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <HeroTile product={first} aspect="aspect-4/5" priority />
              <HeroTile product={third} aspect="aspect-square" />
            </div>
            <div className="pt-8">
              <HeroTile product={second} aspect="aspect-3/4" priority />
            </div>
          </div>

          {first && (
            <div className="absolute -bottom-4 left-3 flex max-w-[15rem] items-center gap-3 rounded-2xl border border-ink-100 bg-white/95 p-3 shadow-lift backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 sm:left-8">
              <ProductImage src={first.image} alt="" className="size-12 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <p className="clamp-1 text-xs font-semibold">{first.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{formatCurrency(first.price)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
