/**
 * Shared business constants. Environment variables always win, so deployment
 * specific values stay out of the source tree.
 */

export const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;
export const DEFAULT_SHIPPING_FEE = 12;

export const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const PAYMENT_METHODS = ['CARD', 'COD'];

/** Orders in these states can still be cancelled by the customer / admin. */
export const CANCELLABLE_STATUSES = ['PENDING', 'PROCESSING'];

/** Human readable labels used in API payloads and the order timeline. */
export const ORDER_STATUS_LABELS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/**
 * Current shipping rules.
 *
 * @returns {{ freeShippingThreshold: number, shippingFee: number }}
 */
export function getShippingPolicy() {
  return {
    freeShippingThreshold: Number(
      process.env.FREE_SHIPPING_THRESHOLD ?? DEFAULT_FREE_SHIPPING_THRESHOLD
    ),
    shippingFee: Number(process.env.SHIPPING_FEE ?? DEFAULT_SHIPPING_FEE),
  };
}

/**
 * @param {number} subtotalCents
 * @returns {{ shippingFeeCents: number, totalCents: number, freeShippingThresholdCents: number }}
 */
export function calculateShipping(subtotalCents) {
  const { freeShippingThreshold, shippingFee } = getShippingPolicy();
  const freeShippingThresholdCents = Math.round(freeShippingThreshold * 100);
  const shippingFeeCents =
    subtotalCents <= 0 || subtotalCents >= freeShippingThresholdCents
      ? 0
      : Math.round(shippingFee * 100);

  return {
    shippingFeeCents,
    totalCents: subtotalCents + shippingFeeCents,
    freeShippingThresholdCents,
  };
}
