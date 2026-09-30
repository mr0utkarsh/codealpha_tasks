import { CANCELLABLE_STATUSES } from '../config/constants.js';
import { ApiError } from '../lib/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { buildCartTotals } from '../utils/cartTotals.js';
import { fromCents, toCents } from '../utils/money.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { serializeOrder } from '../utils/serialize.js';

const ORDER_INCLUDE = { items: { orderBy: { productName: 'asc' } } };
const MAX_ORDER_NUMBER_ATTEMPTS = 3;

/**
 * Turns the request into concrete order lines. When `items` is omitted the
 * customer's saved cart is used ("checkout"), otherwise the explicit list is
 * used ("buy now"). Prices always come from the database, never the client.
 *
 * @param {string} userId
 * @param {{ productId: string, quantity: number }[]} [items]
 */
async function resolveLines(userId, items) {
  if (items?.length) {
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((item) => item.productId) } },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    return items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) {
        throw ApiError.notFound('One of the products in your order is no longer available.');
      }
      return { product, quantity: item.quantity };
    });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!cartItems.length) {
    throw ApiError.badRequest('Your cart is empty - add something before checking out.');
  }

  return cartItems.map((item) => ({ product: item.product, quantity: item.quantity }));
}

/**
 * Creates the order inside a transaction. Stock is decremented with a
 * conditional update (`stock >= quantity`), which is safe under concurrent
 * checkouts: a second request fails instead of overselling the product.
 */
async function persistOrder({ userId, lines, totals, input }) {
  const orderData = {
    userId,
    subtotal: fromCents(totals.subtotalCents),
    shippingFee: fromCents(totals.shippingFeeCents),
    totalAmount: fromCents(totals.totalCents),
    paymentMethod: input.paymentMethod,
    // Card payments are simulated and settle immediately; cash on delivery
    // stays pending until the courier collects the money.
    paymentStatus: input.paymentMethod === 'CARD' ? 'PAID' : 'PENDING',
    status: input.paymentMethod === 'CARD' ? 'PROCESSING' : 'PENDING',
    notes: input.notes || null,
    ...input.shippingAddress,
  };

  for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        for (const line of lines) {
          const reserved = await tx.product.updateMany({
            where: { id: line.product.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });

          if (reserved.count === 0) {
            throw ApiError.conflict(
              `Sorry - ${line.product.name} sold out while you were checking out. Please adjust your bag.`
            );
          }
        }

        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            ...orderData,
            items: {
              create: lines.map((line) => ({
                productId: line.product.id,
                productName: line.product.name,
                productImage: line.product.image,
                quantity: line.quantity,
                price: line.product.price,
              })),
            },
          },
          include: ORDER_INCLUDE,
        });

        if (!input.items?.length) {
          await tx.cartItem.deleteMany({ where: { userId } });
        }

        return order;
      });
    } catch (error) {
      const duplicateOrderNumber =
        error?.code === 'P2002' && String(error?.meta?.target ?? '').includes('order_number');

      if (!duplicateOrderNumber || attempt === MAX_ORDER_NUMBER_ATTEMPTS) throw error;
    }
  }

  throw ApiError.internal('We could not place that order. Please try again.');
}

/**
 * Places an order for the signed-in customer.
 *
 * @param {string} userId
 * @param {object} input validated `createOrderSchema` payload
 */
export async function createOrder(userId, input) {
  const lines = await resolveLines(userId, input.items);
  const totals = buildCartTotals(
    lines.map((line) => ({ priceCents: toCents(line.product.price), quantity: line.quantity }))
  );

  const order = await persistOrder({ userId, lines, totals, input });
  return serializeOrder(order);
}

/**
 * @param {string} userId
 * @param {{ status?: string, page?: number, limit?: number, all?: boolean }} options
 */
export async function listOrders(userId, options = {}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const where = {
    ...(options.all ? {} : { userId }),
    ...(options.status ? { status: options.status } : {}),
  };

  const [total, records] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: records.map(serializeOrder),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * @param {string} userId
 * @param {string} orderId
 * @param {{ isAdmin?: boolean }} [options]
 */
export async function getOrderById(userId, orderId, options = {}) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(options.isAdmin ? {} : { userId }) },
    include: ORDER_INCLUDE,
  });

  if (!order) throw ApiError.notFound('We could not find that order.');
  return serializeOrder(order);
}

async function restockItems(tx, items) {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/**
 * Admin transition between order states. Cancelling returns the reserved stock.
 *
 * @param {string} orderId
 * @param {string} nextStatus
 */
export async function updateOrderStatus(orderId, nextStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw ApiError.notFound('We could not find that order.');
  if (order.status === nextStatus) return serializeOrder(order);

  if (order.status === 'CANCELLED' && nextStatus !== 'CANCELLED') {
    throw ApiError.conflict(
      'A cancelled order cannot be reopened. Please ask the customer to place a new order.'
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (nextStatus === 'CANCELLED') {
      await restockItems(tx, order.items);
    }

    const paymentStatus =
      nextStatus === 'DELIVERED' && order.paymentMethod === 'COD'
        ? 'PAID'
        : nextStatus === 'CANCELLED' && order.paymentStatus === 'PAID'
          ? 'REFUNDED'
          : order.paymentStatus;

    return tx.order.update({
      where: { id: orderId },
      data: { status: nextStatus, paymentStatus },
      include: ORDER_INCLUDE,
    });
  });

  return serializeOrder(updated);
}

/**
 * Customer initiated cancellation - only possible before dispatch.
 *
 * @param {string} userId
 * @param {string} orderId
 */
export async function cancelOrder(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) throw ApiError.notFound('We could not find that order.');

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw ApiError.conflict(
      `Orders that are already ${order.status.toLowerCase()} cannot be cancelled. Please contact support.`
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await restockItems(tx, order.items);
    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
      },
      include: ORDER_INCLUDE,
    });
  });

  return serializeOrder(updated);
}

/**
 * Lifetime numbers shown on the customer account dashboard.
 *
 * @param {string} userId
 */
export async function getOrderStats(userId) {
  const [orders, spend] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
    prisma.order.aggregate({
      where: { userId, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),
  ]);

  const byStatus = Object.fromEntries(orders.map((row) => [row.status, row._count._all]));

  return {
    totalOrders: orders.reduce((total, row) => total + row._count._all, 0),
    totalSpent: Number(spend._sum.totalAmount ?? 0),
    activeOrders: (byStatus.PENDING ?? 0) + (byStatus.PROCESSING ?? 0) + (byStatus.SHIPPED ?? 0),
    deliveredOrders: byStatus.DELIVERED ?? 0,
    cancelledOrders: byStatus.CANCELLED ?? 0,
    byStatus,
  };
}

