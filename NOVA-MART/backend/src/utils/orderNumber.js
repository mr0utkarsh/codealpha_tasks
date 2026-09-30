import { randomInt } from 'node:crypto';

/**
 * Builds a human friendly, unique order reference such as `NM-20260318-4192`.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function generateOrderNumber(date = new Date()) {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  return `NM-${stamp}-${randomInt(1000, 9999)}`;
}
