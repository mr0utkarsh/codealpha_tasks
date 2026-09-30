import { ApiError } from '../lib/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { buildCartTotals, serializeCartTotals } from '../utils/cartTotals.js';
import { toCents } from '../utils/money.js';
import { serializeCartItem } from '../utils/serialize.js';

/** Mirrors `MAX_QUANTITY_PER_ITEM` in the cart validators. */
export const MAX_QUANTITY_PER_ITEM = 20;

const CART_INCLUDE = { product: true };

function buildResponse(items) {
  const totals = buildCartTotals(
    items.map((item) => ({ priceCents: toCents(item.product.price), quantity: item.quantity }))
  );

  return {
    items: items.map(serializeCartItem),
    summary: serializeCartTotals(totals),
  };
}

async function fetchCartItems(userId) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: CART_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * The signed-in customer's cart, always returned with a fresh summary so the
 * UI never has to recompute totals client side.
 *
 * @param {string} userId
 */
export async function getCart(userId) {
  return buildResponse(await fetchCartItems(userId));
}

/**
 * Adds a product to the cart, merging quantities with any existing line.
 *
 * @param {string} userId
 * @param {{ productId: string, quantity: number }} input
 */
export async function addToCart(userId, input) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw ApiError.notFound('That product is no longer available.');
  if (product.stock <= 0) throw ApiError.conflict(`${product.name} is out of stock right now.`);

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId: input.productId } },
    select: { id: true, quantity: true },
  });

  const quantity = (existing?.quantity ?? 0) + input.quantity;

  if (quantity > product.stock) {
    throw ApiError.conflict(
      existing
        ? `Your cart already holds ${existing.quantity} of ${product.name} and only ${product.stock} are in stock.`
        : `Only ${product.stock} of ${product.name} are in stock.`
    );
  }

  if (quantity > MAX_QUANTITY_PER_ITEM) {
    throw ApiError.conflict(`You can order up to ${MAX_QUANTITY_PER_ITEM} of the same item.`);
  }

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
  } else {
    await prisma.cartItem.create({
      data: { userId, productId: input.productId, quantity },
    });
  }

  return getCart(userId);
}

/**
 * Sets an exact quantity. `0` removes the line.
 *
 * @param {string} userId
 * @param {string} itemId
 * @param {number} quantity
 */
export async function updateCartItemQuantity(userId, itemId, quantity) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
    include: { product: { select: { id: true, name: true, stock: true } } },
  });

  if (!item) throw ApiError.notFound('That item is no longer in your cart.');

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return getCart(userId);
  }

  if (quantity > item.product.stock) {
    throw ApiError.conflict(`Only ${item.product.stock} of ${item.product.name} are in stock.`);
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart(userId);
}

/**
 * @param {string} userId
 * @param {string} itemId
 */
export async function removeCartItem(userId, itemId) {
  const deleted = await prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
  if (deleted.count === 0) throw ApiError.notFound('That item is no longer in your cart.');
  return getCart(userId);
}

/**
 * Empties the cart.
 *
 * @param {string} userId
 */
export async function clearCart(userId) {
  await prisma.cartItem.deleteMany({ where: { userId } });
  return getCart(userId);
}

/**
 * Merges a guest cart (kept in the browser) into the signed-in customer's cart.
 * Unknown products are skipped, quantities are clamped to available stock and
 * to {@link MAX_QUANTITY_PER_ITEM}.
 *
 * @param {string} userId
 * @param {{ productId: string, quantity: number }[]} items
 */
export async function mergeCart(userId, items = []) {
  if (!items.length) {
    return { ...(await getCart(userId)), merged: 0, skipped: 0 };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    select: { id: true, stock: true },
  });
  const stockById = new Map(products.map((product) => [product.id, product.stock]));

  const existingItems = await prisma.cartItem.findMany({
    where: { userId },
    select: { productId: true, quantity: true },
  });
  const quantityByProduct = new Map(existingItems.map((item) => [item.productId, item.quantity]));

  let merged = 0;
  let skipped = 0;

  for (const item of items) {
    const stock = stockById.get(item.productId);
    if (stock === undefined || stock <= 0) {
      skipped += 1;
      continue;
    }

    const current = quantityByProduct.get(item.productId) ?? 0;
    const desired = Math.min(current + item.quantity, stock, MAX_QUANTITY_PER_ITEM);
    if (desired === current) {
      skipped += 1;
      continue;
    }

    await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: item.productId } },
      update: { quantity: desired },
      create: { userId, productId: item.productId, quantity: desired },
    });

    quantityByProduct.set(item.productId, desired);
    merged += 1;
  }

  return { ...(await getCart(userId)), merged, skipped };
}
