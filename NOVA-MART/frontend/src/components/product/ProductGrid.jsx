import { ProductCard } from './ProductCard.jsx';
import { ProductCardSkeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../lib/format.js';

const GRID_CLASSES = {
  sm: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  md: 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  lg: 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
};

/**
 * Uniform product grid with a loading state that mirrors the real layout.
 *
 * @param {{ products: object[], isLoading?: boolean, skeletonCount?: number, columns?: 'sm'|'md'|'lg', className?: string, priorityCount?: number }} props
 */
export function ProductGrid({
  products = [],
  isLoading = false,
  skeletonCount = 8,
  columns = 'md',
  className,
  priorityCount = 0,
}) {
  if (isLoading) {
    return (
      <div className={cn(GRID_CLASSES[columns], className)} aria-busy="true" aria-live="polite">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(GRID_CLASSES[columns], className)}>
      {products.map((product, index) => (
        <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}>
          <ProductCard product={product} priority={index < priorityCount} />
        </div>
      ))}
    </div>
  );
}

/**
 * Horizontally scrollable rail used for "featured" style sections.
 *
 * @param {{ products: object[], className?: string }} props
 */
export function ProductRail({ products = [], className }) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0', className)}>
      {products.map((product) => (
        <div key={product.id} className="w-[16rem] shrink-0 snap-start sm:w-[17rem]">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
