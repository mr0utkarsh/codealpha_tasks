/** Presentation helpers shared across the storefront. */

/**
 * Formats a money value using the store currency.
 *
 * @param {number} amount
 * @param {{ currency?: string, locale?: string, maximumFractionDigits?: number }} [options]
 */
export function formatCurrency(amount, options = {}) {
  const { currency = 'USD', locale = 'en-US', maximumFractionDigits } = options;
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: maximumFractionDigits ?? 2,
    maximumFractionDigits: maximumFractionDigits ?? 2,
  }).format(value);
}

/**
 * @param {string|Date} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', options).format(new Date(value));
}

/**
 * @param {string|Date} value
 */
export function formatDateTime(value) {
  return formatDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Estimated delivery range shown on order screens.
 *
 * @param {string|Date} from
 * @param {number} [minDays]
 * @param {number} [maxDays]
 */
export function estimateDelivery(from, minDays = 3, maxDays = 6) {
  const start = new Date(from ?? Date.now());
  const earliest = new Date(start);
  const latest = new Date(start);
  earliest.setDate(earliest.getDate() + minDays);
  latest.setDate(latest.getDate() + maxDays);

  return `${formatDate(earliest, { month: 'short', day: 'numeric' })} - ${formatDate(latest, {
    month: 'short',
    day: 'numeric',
  })}`;
}

/**
 * Conditional className helper.
 *
 * @param {...(string|false|null|undefined)} values
 */
export function cn(...values) {
  return values.filter(Boolean).join(' ');
}

export function pluralize(count, singular, plural) {
  return Number(count) === 1 ? singular : (plural ?? `${singular}s`);
}

/** "Aarav Mehta" -> "AM" */
export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function truncate(value, length = 90) {
  if (!value) return '';
  return value.length > length ? `${value.slice(0, length - 1).trimEnd()}…` : value;
}

/** Compacts 1240 -> "1.2k" */
export function compactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value) || 0
  );
}
