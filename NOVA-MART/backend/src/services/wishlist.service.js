import { ApiError } from '../lib/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { serializeProduct, serializeWishlistItem } from '../utils/serialize.js';

const WITH_PRODUCT = { product: true };

/**
 * Every wishlist entry of a customer, newest first.
 *
 * @param {string} userId
 */
export async function getWishlist(userId) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: WITH_PRODUCT,
    orderBy: { createdAt: 'desc' },
  });

  return {
    items: items.map(serializeWishlistItem),
    productIds: items.map((item) => item.productId),
  };
}

/**
 * @param {string} userId
 * @param {string} productId
 */
export async function addToWishlist(userId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw ApiError.notFound('That product is no longer available.');

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  if (existing) {
    return { added: false, productId };
  }

  await prisma.wishlistItem.create({ data: { userId, productId } });
  return { added: true, productId };
}

/**
 * Batch version used when a guest wishlist is merged into an account after
 * signing in.
 *
 * @param {string} userId
 * @param {string[]} productIds
 */
export async function addManyToWishlist(userId, productIds) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });

  const existing = await prisma.wishlistItem.findMany({
    where: { userId, productId: { in: products.map((product) => product.id) } },
    select: { productId: true },
  });
  const alreadySaved = new Set(existing.map((item) => item.productId));

  const data = products
    .filter((product) => !alreadySaved.has(product.id))
    .map((product) => ({ userId, productId: product.id }));

  if (data.length) {
    await prisma.wishlistItem.createMany({ data, skipDuplicates: true });
  }

  return { added: data.length, productIds: products.map((product) => product.id) };
}

/**
 * @param {string} userId
 * @param {string} productId
 */
export async function removeFromWishlist(userId, productId) {
  const deleted = await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  return { removed: deleted.count > 0, productId };
}

/**
 * Adds or removes a product in one round trip (used by the heart button).
 *
 * @param {string} userId
 * @param {string} productId
 */
export async function toggleWishlist(userId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw ApiError.notFound('That product is no longer available.');

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { productId, saved: false };
  }

  await prisma.wishlistItem.create({ data: { userId, productId } });
  return { productId, saved: true };
}

