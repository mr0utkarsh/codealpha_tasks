import { calculateShipping } from '../config/constants.js';
import { fromCents } from './money.js';

const dollars = (cents) => Number(fromCents(cents));

/**
 * Builds every money value the cart, checkout and order screens need.
 * All maths happens in integer cents.
 *
 * @param {{ priceCents: number, quantity: number }[]} lines
 */
export function buildCartTotals(lines) {
  const subtotalCents = lines.reduce((total, line) => total + line.priceCents * line.quantity, 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const { shippingFeeCents, totalCents, freeShippingThresholdCents } =
    calculateShipping(subtotalCents);

  return {
    subtotalCents,
    shippingFeeCents,
    totalCents,
    itemCount,
    freeShippingThresholdCents,
    freeShippingRemainingCents: Math.max(0, freeShippingThresholdCents - subtotalCents),
    qualifiesForFreeShipping: subtotalCents > 0 && subtotalCents >= freeShippingThresholdCents,
  };
}

/**
 * JSON friendly representation of {@link buildCartTotals}.
 *
 * @param {ReturnType<typeof buildCartTotals>} totals
 */
export function serializeCartTotals(totals) {
  return {
    itemCount: totals.itemCount,
    subtotal: dollars(totals.subtotalCents),
    shippingFee: dollars(totals.shippingFeeCents),
    total: dollars(totals.totalCents),
    freeShippingThreshold: dollars(totals.freeShippingThresholdCents),
    freeShippingRemaining: dollars(totals.freeShippingRemainingCents),
    qualifiesForFreeShipping: totals.qualifiesForFreeShipping,
    currency: 'USD',
  };
}
