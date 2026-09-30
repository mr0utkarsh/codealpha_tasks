import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../lib/format.js';

/**
 * Product image with a shimmer placeholder and a graceful fallback when a
 * remote image cannot be loaded.
 *
 * @param {{ src: string, alt: string, className?: string, imgClassName?: string, sizes?: string, loading?: 'lazy'|'eager', fetchPriority?: 'high'|'low'|'auto' }} props
 */
export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  loading = 'lazy',
  fetchPriority = 'auto',
}) {
  const [status, setStatus] = useState('loading');
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-ink-100 text-ink-400 dark:bg-ink-800/70 dark:text-ink-500',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-ink-100 dark:bg-ink-800/70', className)}>
      {status === 'loading' && <span className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setFailed(true)}
        className={cn(
          'size-full object-cover transition-opacity duration-500',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
          imgClassName
        )}
      />
    </div>
  );
}

export default ProductImage;
