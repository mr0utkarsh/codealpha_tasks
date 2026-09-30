/**
 * Presentation copy for the catalogue categories. The product data lives in the
 * database; icons and taglines are pure UI concerns.
 *
 * `slug` matches the `category` value stored on products.
 */
import {
  AudioLines,
  Backpack,
  Home,
  Laptop,
  Shirt,
  Smartphone,
  Sparkles,
  Tablet,
  Watch,
  Wine,
} from 'lucide-react';

export const categoryCopy = {
  Laptops: {
    icon: Laptop,
    tagline: 'Workstations you can carry',
    accent: 'from-sky-500/15 to-sky-500/0',
  },
  Smartphones: {
    icon: Smartphone,
    tagline: 'Flagships and everyday heroes',
    accent: 'from-violet-500/15 to-violet-500/0',
  },
  Tablets: {
    icon: Tablet,
    tagline: 'A canvas for work and play',
    accent: 'from-emerald-500/15 to-emerald-500/0',
  },
  Watches: {
    icon: Watch,
    tagline: 'Timepieces worth keeping',
    accent: 'from-amber-500/15 to-amber-500/0',
  },
  Audio: {
    icon: AudioLines,
    tagline: 'Sound that disappears around you',
    accent: 'from-rose-500/15 to-rose-500/0',
  },
  Sneakers: {
    icon: Sparkles,
    tagline: 'Cushioned, clean, classic',
    accent: 'from-indigo-500/15 to-indigo-500/0',
  },
  Bags: {
    icon: Backpack,
    tagline: 'Carry it beautifully',
    accent: 'from-orange-500/15 to-orange-500/0',
  },
  Fragrances: {
    icon: Wine,
    tagline: 'Signature scents',
    accent: 'from-pink-500/15 to-pink-500/0',
  },
  'Home & Living': {
    icon: Home,
    tagline: 'Objects for calmer rooms',
    accent: 'from-teal-500/15 to-teal-500/0',
  },
  Fashion: {
    icon: Shirt,
    tagline: 'Pieces that outlast trends',
    accent: 'from-fuchsia-500/15 to-fuchsia-500/0',
  },
};

/**
 * @param {string} name
 */
export function getCategoryCopy(name) {
  return (
    categoryCopy[name] ?? {
      icon: Sparkles,
      tagline: 'Explore the collection',
      accent: 'from-ink-500/10 to-ink-500/0',
    }
  );
}

export default categoryCopy;
