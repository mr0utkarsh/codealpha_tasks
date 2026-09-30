// Product imagery lives on a public image CDN. Every URL used by the seed
// script has been verified to respond with HTTP 200 (see `prisma/verify-images.js`).
export const IMAGE_CDN = 'https://cdn.dummyjson.com/product-images';

/**
 * Build the gallery for a product.
 *
 * @param {string} folder  CDN folder of the product, e.g. `laptops/lenovo-yoga-920`
 * @param {number} frames  number of gallery frames available
 * @returns {string[]} absolute image URLs
 */
export function gallery(folder, frames) {
  return Array.from({ length: frames }, (_, index) => `${IMAGE_CDN}/${folder}/${index + 1}.webp`);
}
