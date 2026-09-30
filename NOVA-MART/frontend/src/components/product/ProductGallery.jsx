import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '../../lib/format.js';
import ProductImage from '../ui/ProductImage.jsx';

/**
 * Product gallery: large frame, thumbnails, keyboard arrows and a zoom toggle.
 *
 * @param {{ images: string[], name: string, className?: string }} props
 */
export function ProductGallery({ images = [], name, className }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const gallery = images.length ? images : [''];

  // Reset when the product changes.
  useEffect(() => {
    setActiveIndex(0);
    setIsZoomed(false);
  }, [name]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        setActiveIndex((index) => (index + 1) % gallery.length);
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((index) => (index - 1 + gallery.length) % gallery.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gallery.length]);

  const step = (direction) => {
    setActiveIndex((index) => (index + direction + gallery.length) % gallery.length);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-ink-50 dark:border-ink-800 dark:bg-ink-900">
        <ProductImage
          src={gallery[activeIndex]}
          alt={`${name} - view ${activeIndex + 1}`}
          loading="eager"
          fetchPriority="high"
          className="aspect-square w-full"
          imgClassName={cn('transition-transform duration-700 ease-smooth', isZoomed && 'scale-150 cursor-zoom-out')}
        />

        <button
          type="button"
          onClick={() => setIsZoomed((value) => !value)}
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/85 text-ink-700 backdrop-blur transition hover:bg-white dark:bg-ink-900/80 dark:text-ink-100"
          aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
        >
          <ZoomIn className="size-4" aria-hidden="true" />
        </button>

        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink-700 opacity-0 backdrop-blur transition group-hover:opacity-100 dark:bg-ink-900/80 dark:text-ink-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink-700 opacity-0 backdrop-blur transition group-hover:opacity-100 dark:bg-ink-900/80 dark:text-ink-100"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'overflow-hidden rounded-2xl border-2 transition',
                index === activeIndex
                  ? 'border-ink-950 dark:border-white'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <ProductImage
                src={image}
                alt={`${name} thumbnail ${index + 1}`}
                className="size-20 bg-ink-100 dark:bg-ink-800"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
