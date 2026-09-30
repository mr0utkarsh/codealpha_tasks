import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartApi, productsApi } from '../lib/api.js';
import { clearGuestCart, readGuestCart, writeGuestCart } from '../lib/guestStorage.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(null);

/** Mirrors the defaults in backend/src/config/constants.js. */
const DEFAULT_POLICY = { freeShippingThreshold: 150, shippingFee: 12 };
export const MAX_QUANTITY_PER_ITEM = 20;

const round = (value) => Math.round(value * 100) / 100;

const EMPTY_SUMMARY = {
  itemCount: 0,
  subtotal: 0,
  shippingFee: 0,
  total: 0,
  freeShippingThreshold: DEFAULT_POLICY.freeShippingThreshold,
  freeShippingRemaining: DEFAULT_POLICY.freeShippingThreshold,
  qualifiesForFreeShipping: false,
  currency: 'USD',
};

/** Client side totals for guest carts - the same rules the API applies. */
function computeSummary(items, policy) {
  const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const qualifiesForFreeShipping = subtotal > 0 && subtotal >= policy.freeShippingThreshold;
  const shippingFee = subtotal > 0 && !qualifiesForFreeShipping ? policy.shippingFee : 0;

  return {
    itemCount,
    subtotal: round(subtotal),
    shippingFee: round(shippingFee),
    total: round(subtotal + shippingFee),
    freeShippingThreshold: policy.freeShippingThreshold,
    freeShippingRemaining: Math.max(0, round(policy.freeShippingThreshold - subtotal)),
    qualifiesForFreeShipping,
    currency: 'USD',
  };
}

/**
 * Cart state for both guests and signed-in customers.
 *
 * - guests    -> localStorage (`novamart.cart`)
 * - customers -> the server side cart API
 *
 * Signing in merges the guest bag into the account so nothing is lost.
 */
export function CartProvider({ children }) {
  const { isAuthenticated, isReady, user } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);
  const [policy, setPolicy] = useState(DEFAULT_POLICY);

  const previousUserId = useRef(null);

  // Shipping rules come from the API so guest totals match the server exactly.
  useEffect(() => {
    let active = true;

    productsApi
      .summary()
      .then((payload) => {
        if (!active || !payload?.data) return;
        setPolicy({
          freeShippingThreshold:
            payload.data.freeShippingThreshold ?? DEFAULT_POLICY.freeShippingThreshold,
          shippingFee: payload.data.shippingFee ?? DEFAULT_POLICY.shippingFee,
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const hydrateGuestCart = useCallback(async () => {
    const stored = readGuestCart();

    if (!stored.length) {
      setItems([]);
      setSummary(computeSummary([], policy));
      return [];
    }

    const payload = await productsApi.byIds(stored.map((item) => item.productId));
    const byId = new Map((payload?.data ?? []).map((product) => [product.id, product]));

    const hydrated = stored
      .filter((item) => byId.has(item.productId))
      .map((item) => {
        const product = byId.get(item.productId);
        const quantity = Math.max(1, Math.min(item.quantity, product.stock || MAX_QUANTITY_PER_ITEM));
        return {
          id: product.id,
          productId: product.id,
          quantity,
          product,
          lineTotal: round(product.price * quantity),
        };
      });

    writeGuestCart(hydrated.map(({ productId, quantity }) => ({ productId, quantity })));
    setItems(hydrated);
    setSummary(computeSummary(hydrated, policy));
    return hydrated;
  }, [policy]);

  const loadServerCart = useCallback(async () => {
    const payload = await cartApi.get();
    const cart = payload?.data ?? {};
    setItems(cart.items ?? []);
    setSummary(cart.summary ?? EMPTY_SUMMARY);
    return cart.items ?? [];
  }, []);

  const applyServerCart = useCallback((cart) => {
    setItems(cart?.items ?? []);
    setSummary(cart?.summary ?? EMPTY_SUMMARY);
  }, []);

  // Load the right cart whenever the session or shipping policy changes.
  useEffect(() => {
    if (!isReady) return undefined;

    let active = true;
    setIsLoading(true);
    setError(null);

    const run = async () => {
      try {
        if (isAuthenticated) {
          const guestItems = readGuestCart();

          if (guestItems.length) {
            const payload = await cartApi.merge(guestItems);
            clearGuestCart();
            if (!active) return;
            applyServerCart(payload?.data);
            if (payload?.data?.merged > 0) {
              toast.success(
                `${payload.data.merged} item(s) from your guest bag were saved to your account.`
              );
            }
          } else {
            const serverItems = await loadServerCart();
            if (active) setItems(serverItems);
          }
        } else {
          await hydrateGuestCart();
        }
      } catch (requestError) {
        if (active) setError(requestError);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isReady, policy]);

  // Wipe the previous customer's bag from memory on sign out.
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserId.current && !currentUserId) {
      setItems([]);
      setSummary(EMPTY_SUMMARY);
    }
    previousUserId.current = currentUserId;
  }, [user?.id]);

  // Keep the signed-out flow identical: clamp like the API does, persist, re-hydrate.
  const updateQuantity = useCallback(
    async (item, quantity) => {
      if (!item?.productId) return;

      const stockCeiling = item.product?.stock || MAX_QUANTITY_PER_ITEM;
      const nextQuantity = Math.max(
        1,
        Math.min(quantity || 1, stockCeiling, MAX_QUANTITY_PER_ITEM)
      );

      setIsMutating(true);
      try {
        if (isAuthenticated) {
          const payload = await cartApi.update(item.id, nextQuantity);
          applyServerCart(payload?.data);
        } else {
          const stored = readGuestCart();
          writeGuestCart(
            stored.map((entry) =>
              entry.productId === item.productId ? { ...entry, quantity: nextQuantity } : entry
            )
          );
          await hydrateGuestCart();
        }
      } catch (requestError) {
        toast.error(requestError.message || 'We could not update that item.');
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [applyServerCart, hydrateGuestCart, isAuthenticated, toast]
  );

  const addItem = useCallback(
    async (product, quantity = 1) => {
      if (!product?.id) return;

      setIsMutating(true);
      try {
        if (isAuthenticated) {
          const payload = await cartApi.add({ productId: product.id, quantity });
          applyServerCart(payload?.data);
        } else if (product.stock > 0) {
          const stored = readGuestCart();
          const existing = stored.find((item) => item.productId === product.id);
          const nextQuantity = Math.min(
            (existing?.quantity ?? 0) + quantity,
            product.stock || MAX_QUANTITY_PER_ITEM,
            MAX_QUANTITY_PER_ITEM
          );

          const nextStored = existing
            ? stored.map((item) =>
                item.productId === product.id ? { ...item, quantity: nextQuantity } : item
              )
            : [...stored, { productId: product.id, quantity: nextQuantity }];

          writeGuestCart(nextStored);
          await hydrateGuestCart();
        }

        toast.success(`${product.name} added to your bag.`);
      } catch (requestError) {
        toast.error(requestError.message || 'We could not add that item to your bag.');
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [applyServerCart, hydrateGuestCart, isAuthenticated, toast]
  );

  const removeItem = useCallback(
    async (item) => {
      setIsMutating(true);
      try {
        if (isAuthenticated) {
          const payload = await cartApi.remove(item.id);
          applyServerCart(payload?.data);
        } else {
          writeGuestCart(readGuestCart().filter((entry) => entry.productId !== item.productId));
          await hydrateGuestCart();
        }
        toast.info(`${item.product.name} removed from your bag.`);
      } catch (requestError) {
        toast.error(requestError.message || 'We could not remove that item.');
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [applyServerCart, hydrateGuestCart, isAuthenticated, toast]
  );

  const clearCart = useCallback(async () => {
    setIsMutating(true);
    try {
      if (isAuthenticated) {
        const payload = await cartApi.clear();
        applyServerCart(payload?.data);
      } else {
        clearGuestCart();
        setItems([]);
        setSummary(computeSummary([], policy));
      }
      toast.info('Your bag is now empty.');
    } catch (requestError) {
      toast.error(requestError.message || 'We could not empty your bag.');
      throw requestError;
    } finally {
      setIsMutating(false);
    }
  }, [applyServerCart, isAuthenticated, policy, toast]);

  const refresh = useCallback(async () => {
    if (isAuthenticated) return loadServerCart();
    return hydrateGuestCart();
  }, [hydrateGuestCart, isAuthenticated, loadServerCart]);

  const value = useMemo(
    () => ({
      items,
      summary,
      error,
      isLoading,
      isMutating,
      itemCount: summary.itemCount,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
    }),
    [
      items,
      summary,
      error,
      isLoading,
      isMutating,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside a <CartProvider>.');
  return context;
}

export { computeSummary };
export default CartContext;
