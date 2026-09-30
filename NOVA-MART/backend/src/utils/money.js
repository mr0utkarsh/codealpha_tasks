/**
 * Money helpers.
 *
 * All arithmetic is done in integer cents so that totals are never affected by
 * floating point rounding. Values are converted back to fixed-point strings
 * before they are handed to Prisma's `Decimal` columns.
 */

/**
 * @param {number|string} amount  e.g. 19.99 or "19.99"
 * @returns {number} integer cents
 */
export function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

/**
 * @param {number} cents
 * @returns {string} fixed-point string, e.g. "19.99"
 */
export function fromCents(cents) {
  return (Math.round(cents) / 100).toFixed(2);
}

/**
 * Rounds a USD amount to two decimals (used for display-only values).
 *
 * @param {number} amount
 * @returns {number}
 */
export function roundCurrency(amount) {
  return Math.round(Number(amount) * 100) / 100;
}
