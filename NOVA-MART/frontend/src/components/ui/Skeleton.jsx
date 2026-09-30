import { cn } from '../../lib/format.js';

/** Generic shimmer block. */
export function Skeleton({ className }) {
  return <span className={cn('skeleton block', className)} aria-hidden="true" />;
}

export function SkeletonText({ lines = 2, className }) {
  return (
    <span className={cn('block space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span
          key={index}
          className="skeleton block h-3 rounded-full"
          style={{ width: index === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </span>
  );
}

/** Placeholder that mirrors the real product card layout. */
export function ProductCardSkeleton({ className }) {
  return (
    <div className={cn('overflow-hidden rounded-3xl border border-ink-100 dark:border-ink-800', className)}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-2/3 rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
