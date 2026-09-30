import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { getCategoryCopy } from '../../data/categoryCopy.js';
import { cn, formatCurrency } from '../../lib/format.js';
import ProductImage from '../ui/ProductImage.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { EmptyState } from '../ui/Feedback.jsx';
import { ProductGrid, ProductRail } from '../product/ProductGrid.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

const PROMISES = [
  { icon: Truck, title: 'Free express shipping', copy: 'On orders over $150' },
  { icon: RotateCcw, title: '30-day returns', copy: 'Free and simple' },
  { icon: ShieldCheck, title: '2-year warranty', copy: 'On every electronic' },
  { icon: BadgeCheck, title: 'Authenticity checked', copy: 'Every single item' },
];

export function PromisesSection() {
  return (
    <section className="border-b border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-950/30">
      <div className="container grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-100">
              <Icon className="size-[1.1rem]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Category tiles built from the live catalogue roll-up.
 */
export function CategoriesSection({ categories = [], isLoading = false }) {
  const visible = categories.slice(0, 6);

  return (
    <section className="container py-16 lg:py-20">
      <SectionHeading
        eyebrow="Browse"
        title="Shop by category"
        description="Ten curated departments, from flagship tech to the small things that finish a room."
        action={{ label: 'All categories', to: '/products' }}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-44 w-full rounded-3xl" />
            ))
          : visible.map((category) => {
              const copy = getCategoryCopy(category.name);
              const Icon = copy.icon;

              return (
                <Link
                  key={category.name}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group relative flex items-end overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-card dark:border-ink-800 dark:bg-ink-900/40"
                >
                  {category.image && (
                    <ProductImage
                      src={category.image}
                      alt={category.name}
                      className="absolute inset-0 size-full opacity-25 transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn('absolute inset-0 bg-gradient-to-tr', copy.accent)}
                  />

                  <span className="relative">
                    <span className="grid size-11 place-items-center rounded-2xl bg-white/90 text-ink-900 shadow-soft dark:bg-ink-950/80 dark:text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="mt-3 block font-display text-lg font-semibold">
                      {category.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-600 dark:text-ink-300">
                      {copy.tagline} · {category.productCount} items
                    </span>
                    {category.startingPrice !== null && (
                      <span className="mt-2 block text-xs font-medium text-ink-500 dark:text-ink-400">
                        from {formatCurrency(category.startingPrice)}
                      </span>
                    )}
                  </span>

                  <ArrowUpRight
                    className="relative ml-auto size-5 text-ink-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-ink-300"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
      </div>
    </section>
  );
}


/**
 * Horizontal rail of the current "editor's picks".
 */
export function FeaturedSection({ products = [], isLoading = false }) {
  return (
    <section className="border-y border-ink-100 bg-white py-16 dark:border-ink-800 dark:bg-ink-950/30 lg:py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Editor's picks"
          title="Featured this week"
          description="The pieces our team keeps recommending - from studio-ready laptops to a watch you hand down."
          action={{ label: 'Shop all featured', to: '/products?featured=true' }}
        />

        <div className="mt-8">
          {isLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-80 w-[17rem] shrink-0 rounded-3xl" />
              ))}
            </div>
          ) : products.length ? (
            <ProductRail products={products} />
          ) : (
            <EmptyState title="Nothing featured right now" description="Check back soon." />
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Grid of the products customers are buying most.
 */
export function TrendingSection({ products = [], isLoading = false }) {
  return (
    <section className="container py-16 lg:py-20">
      <SectionHeading
        eyebrow="Trending now"
        title="What everyone is buying"
        description="Ranked by real review volume across the catalogue."
        action={{ label: 'Browse bestsellers', to: '/products?sort=popularity' }}
      />

      <div className="mt-8">
        <ProductGrid products={products} isLoading={isLoading} skeletonCount={8} columns="md" />
      </div>
    </section>
  );
}

/**
 * Closing panel: account benefits next to the newest arrivals.
 */
export function NewsletterCta({ newest = [] }) {
  const tiles = newest.length ? newest : Array.from({ length: 4 });

  return (
    <section className="container pb-4">
      <div className="grid overflow-hidden rounded-4xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900/40 lg:grid-cols-2">
        <div className="p-8 sm:p-12">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            Nova membership
          </p>
          <h2 className="mt-3 text-balance text-2xl font-bold sm:text-3xl">
            Create an account and get 15% off your first order.
          </h2>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            Members get early access to drops, a wishlist that syncs across devices, tracked order
            history and free returns for a full year.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/register" size="lg">
              Create your account
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink to="/login" variant="secondary" size="lg">
              I already have one
            </ButtonLink>
          </div>

          <ul className="mt-8 grid gap-2 text-xs text-ink-600 dark:text-ink-300 sm:grid-cols-2">
            {[
              'Synced bag and wishlist',
              'Order tracking in one place',
              'Early access to new arrivals',
              'Free 30-day returns',
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-ink-50 p-6 dark:bg-ink-950/40 sm:p-8">
          {tiles.slice(0, 4).map((product, index) =>
            product ? (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="group overflow-hidden rounded-3xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900"
              >
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="aspect-square w-full"
                  imgClassName="transition-transform duration-700 group-hover:scale-105"
                />
                <span className="block p-3">
                  <span className="clamp-1 block text-xs font-medium">{product.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-500 dark:text-ink-400">
                    {formatCurrency(product.price)}
                  </span>
                </span>
              </Link>
            ) : (
              <Skeleton key={index} className="aspect-square w-full rounded-3xl" />
            )
          )}
        </div>
      </div>
    </section>
  );
}
