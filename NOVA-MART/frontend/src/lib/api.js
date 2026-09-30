/**
 * Minimal, dependency free API client for the NOVA MART backend.
 *
 * - prefixes every path with `VITE_API_URL`
 * - attaches the JWT (when present) as a Bearer token
 * - unwraps the `{ success, data, meta }` envelope
 * - throws a rich `ApiError` for non 2xx responses
 */

const DEV_DEFAULT_API_URL = 'http://localhost:5000/api';
const RAW_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEV_DEFAULT_API_URL : `${window.location.origin}/api`);
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export const TOKEN_STORAGE_KEY = 'novamart.token';

export class ApiError extends Error {
  constructor(message, { status = 0, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field level validation messages, keyed by field name. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return this.details.reduce((accumulator, issue) => {
      if (issue?.field) accumulator[issue.field] = issue.message;
      return accumulator;
    }, {});
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

let authToken =
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
let unauthorizedHandler = null;

/** Keeps the in-memory token in sync with the auth context. */
export function setAuthToken(token) {
  authToken = token || null;
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAuthToken() {
  return authToken;
}

/** Called whenever the API answers 401 so the app can sign the user out. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function buildQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (!value.length) return;
      search.set(key, value.join(','));
      return;
    }
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: unknown, params?: object, signal?: AbortSignal, skipAuth?: boolean }} [options]
 */
async function request(path, options = {}) {
  const { method = 'GET', body, params, signal, skipAuth = false } = options;

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!skipAuth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(
      'We could not reach the NOVA MART API. Check your connection and make sure the server is running.',
      { status: 0, code: 'NETWORK_ERROR' }
    );
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const error = new ApiError(
      payload?.message || `Request failed with status ${response.status}.`,
      { status: response.status, code: payload?.code, details: payload?.details }
    );

    if (response.status === 401 && !skipAuth && unauthorizedHandler) {
      unauthorizedHandler(error);
    }

    throw error;
  }

  return payload;
}

/** Full envelope: `{ success, data, meta }`. */
export function requestEnvelope(path, options) {
  return request(path, options);
}

/** Just the `data` payload. */
export async function requestData(path, options) {
  const payload = await request(path, options);
  return payload?.data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

/* -------------------------------------------------------------------------- */
/* Endpoint groups - thin wrappers around the REST resources                   */
/* -------------------------------------------------------------------------- */

export const productsApi = {
  list: (params, options) => request('/products', { ...options, params }),
  categories: (options) => request('/products/categories', options),
  summary: (options) => request('/products/summary', options),
  detail: (idOrSlug, options) => request(`/products/${encodeURIComponent(idOrSlug)}`, options),
  byIds: (ids, options) =>
    ids.length
      ? request('/products', { ...options, params: { ids, limit: Math.min(ids.length, 60) } })
      : Promise.resolve({ success: true, data: [] }),
};

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, skipAuth: true }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, skipAuth: true }),
  me: (options) => request('/auth/me', options),
  updateProfile: (payload) => request('/auth/profile', { method: 'PATCH', body: payload }),
  changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),
};

export const cartApi = {
  get: (options) => request('/cart', options),
  add: (payload) => request('/cart', { method: 'POST', body: payload }),
  update: (itemId, quantity) => request(`/cart/${itemId}`, { method: 'PATCH', body: { quantity } }),
  remove: (itemId) => request(`/cart/${itemId}`, { method: 'DELETE' }),
  clear: () => request('/cart', { method: 'DELETE' }),
  merge: (items) => request('/cart/merge', { method: 'POST', body: { items } }),
};

export const wishlistApi = {
  get: (options) => request('/wishlist', options),
  add: (productId) => request('/wishlist', { method: 'POST', body: { productId } }),
  addMany: (productIds) => request('/wishlist', { method: 'POST', body: { productIds } }),
  toggle: (productId) => request('/wishlist/toggle', { method: 'POST', body: { productId } }),
  remove: (productId) => request(`/wishlist/${productId}`, { method: 'DELETE' }),
};

export const ordersApi = {
  create: (payload) => request('/orders', { method: 'POST', body: payload }),
  list: (params, options) => request('/orders', { ...options, params }),
  stats: (options) => request('/orders/stats', options),
  detail: (id, options) => request(`/orders/${encodeURIComponent(id)}`, options),
  cancel: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
};

export const systemApi = {
  health: (options) => request('/health', options),
};

export const aiApi = {
  assistSearch: (query) => request('/ai/search-assist', { method: 'POST', body: { query } }),
  recommendProducts: () => request('/ai/recommendations', { method: 'POST' }),
  generateProductDescription: (payload) => request('/ai/product-description', { method: 'POST', body: payload }),
};

