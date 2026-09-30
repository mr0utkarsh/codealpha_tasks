/**
 * Seed catalogue for NOVA MART.
 *
 * Product copy is written in the store's voice; images point at a public image
 * CDN and are verified by `npm run db:verify-images` (prisma/verify-images.js).
 */
import { gallery } from './images.js';
import { laptops } from './products/laptops.js';
import { mobile } from './products/mobile.js';
import { watches } from './products/watches.js';
import { audio } from './products/audio.js';
import { sneakers } from './products/sneakers.js';
import { bags } from './products/bags.js';
import { fashion } from './products/fashion.js';
import { fragrances } from './products/fragrance.js';
import { homeLiving } from './products/home.js';

export const categoryNames = [
  'Laptops',
  'Smartphones',
  'Tablets',
  'Watches',
  'Audio',
  'Sneakers',
  'Bags',
  'Fragrances',
  'Home & Living',
  'Fashion',
];

const definitions = [
  ...laptops,
  ...mobile,
  ...watches,
  ...audio,
  ...sneakers,
  ...bags,
  ...fashion,
  ...fragrances,
  ...homeLiving,
];

/** Catalogue with resolved `image` + `images` fields, ready to be inserted. */
export const products = definitions.map(({ folder, frames, ...product }) => {
  const images = gallery(folder, frames);
  return { ...product, image: images[0], images };
});

/** Fails fast when the seed data itself is inconsistent. */
export function assertSeedIntegrity() {
  const seenSlugs = new Set();
  const seenNames = new Set();

  for (const product of products) {
    if (seenSlugs.has(product.slug)) {
      throw new Error(`Duplicate product slug in seed data: ${product.slug}`);
    }
    if (seenNames.has(product.name)) {
      throw new Error(`Duplicate product name in seed data: ${product.name}`);
    }
    if (!categoryNames.includes(product.category)) {
      throw new Error(`Unknown category "${product.category}" for product "${product.name}"`);
    }
    if (product.price <= 0) {
      throw new Error(`Product "${product.name}" must have a positive price`);
    }
    if (product.comparePrice && product.comparePrice <= product.price) {
      throw new Error(`Product "${product.name}" has a comparePrice lower than its price`);
    }
    if (product.stock < 0 || !Number.isInteger(product.stock)) {
      throw new Error(`Product "${product.name}" has an invalid stock value`);
    }
    if (!product.image || !product.images.length) {
      throw new Error(`Product "${product.name}" is missing imagery`);
    }
    seenSlugs.add(product.slug);
    seenNames.add(product.name);
  }

  return { productCount: products.length, categoryCount: categoryNames.length };
}

export { demoUsers } from './users.js';
export { demoCart, demoWishlist, demoOrders, demoShippingAddress } from './demo-activity.js';
