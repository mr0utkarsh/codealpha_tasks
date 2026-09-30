import { ORDER_STATUS_LABELS } from '../config/constants.js';

/**
 * Converters that turn Prisma records into JSON-safe API payloads.
 * Prisma `Decimal` values are serialised as numbers, and password hashes are
 * never included.
 */

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));
const toIso = (value) => (value ? new Date(value).toISOString() : null);

/**
 * @param {import('@prisma/client').User} user
 */
export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    createdAt: toIso(user.createdAt),
  };
}

/**
 * @param {import('@prisma/client').Product} product
 */
export function serializeProduct(product) {
  const price = toNumber(product.price);
  const comparePrice = toNumber(product.comparePrice);
  const discountPercent =
    comparePrice && comparePrice > price ? Math.round((1 - price / comparePrice) * 100) : null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    description: product.description,
    price,
    comparePrice,
    discountPercent,
    currency: 'USD',
    image: product.image,
    images: product.images ?? [product.image],
    category: product.category,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    inStock: product.stock > 0,
    isFeatured: product.isFeatured,
    isTrending: product.isTrending,
    createdAt: toIso(product.createdAt),
  };
}

/**
 * @param {import('@prisma/client').CartItem & { product: import('@prisma/client').Product }} item
 */
export function serializeCartItem(item) {
  const product = serializeProduct(item.product);
  return {
    id: item.id,
    quantity: item.quantity,
    product,
    lineTotal: Number((product.price * item.quantity).toFixed(2)),
  };
}

/**
 * @param {import('@prisma/client').WishlistItem & { product: import('@prisma/client').Product }} item
 */
export function serializeWishlistItem(item) {
  return {
    id: item.id,
    addedAt: toIso(item.createdAt),
    product: serializeProduct(item.product),
  };
}

/**
 * @param {import('@prisma/client').Order & { items?: import('@prisma/client').OrderItem[] }} order
 */
export function serializeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status] ?? order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: toNumber(order.subtotal),
    shippingFee: toNumber(order.shippingFee),
    totalAmount: toNumber(order.totalAmount),
    currency: 'USD',
    notes: order.notes ?? null,
    createdAt: toIso(order.createdAt),
    updatedAt: toIso(order.updatedAt),
    shippingAddress: {
      fullName: order.fullName,
      email: order.email,
      phone: order.phone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2 ?? '',
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
      country: order.country,
    },
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      image: item.productImage,
      quantity: item.quantity,
      price: toNumber(item.price),
      lineTotal: Number((toNumber(item.price) * item.quantity).toFixed(2)),
    })),
    itemCount:
      order.items?.reduce((total, item) => total + item.quantity, 0) ??
      order._count?.items ??
      0,
  };
}
