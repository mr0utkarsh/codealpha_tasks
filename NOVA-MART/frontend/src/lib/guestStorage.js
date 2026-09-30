/**
 * Guest (signed-out) cart + wishlist persisted in localStorage.
 *
 * Signed-in customers get the same data from the API, so the storefront hides
 * this detail behind the cart and wishlist contexts.
 */

const CART_KEY = 'novamart.cart';
const WISHLIST_KEY = 'novamart.wishlist';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable - the cart simply will not persist */
  }
}

/* ---------------------------------- cart ---------------------------------- */

/**
 * @returns {{ productId: string, quantity: number }[]}
 */
export function readGuestCart() {
  const items = readJson(CART_KEY, []);
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && typeof item.productId === 'string' && Number(item.quantity) > 0)
    .map((item) => ({ productId: item.productId, quantity: Math.min(Number(item.quantity), 20) }));
}

export function writeGuestCart(items) {
  writeJson(CART_KEY, items);
}

export function clearGuestCart() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    /* ignore */
  }
}

/* -------------------------------- wishlist -------------------------------- */

/**
 * @returns {string[]} product ids
 */
export function readGuestWishlist() {
  const ids = readJson(WISHLIST_KEY, []);
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => typeof id === 'string' && id);
}

export function writeGuestWishlist(ids) {
  writeJson(WISHLIST_KEY, [...new Set(ids)]);
}

export function clearGuestWishlist() {
  try {
    localStorage.removeItem(WISHLIST_KEY);
  } catch {
    /* ignore */
  }
}

export const GUEST_STORAGE_KEYS = { CART_KEY, WISHLIST_KEY };
