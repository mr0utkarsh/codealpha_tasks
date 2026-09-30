import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { productsApi, wishlistApi } from '../lib/api.js';
import { clearGuestWishlist, readGuestWishlist, writeGuestWishlist } from '../lib/guestStorage.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const WishlistContext = createContext(null);

/**
 * Wishlist state for guests (localStorage) and signed-in customers (API).
 *
 * Only product ids are stored; full product records are hydrated from the
 * catalogue, which keeps both sources consistent.
 */
export function WishlistProvider({ children }) {
  const { isAuthenticated, isReady } = useAuth();
  const toast = useToast();

  const [productIds, setProductIds] = useState([]);
  const [products, setProducts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const hydrateProducts = useCallback(async (ids) => {
    if (!ids.length) return;

    try {
      const payload = await productsApi.byIds(ids);
      setProducts((current) => {
        const next = { ...current };
        (payload?.data ?? []).forEach((product) => {
          next[product.id] = product;
        });
        return next;
      });
    } catch {
      /* hydration is best effort - the wishlist page falls back to skeletons */
    }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const payload = await wishlistApi.get();
        const ids = payload?.data?.productIds ?? [];
        const items = payload?.data?.items ?? [];

        setProductIds(ids);
        setProducts((current) => {
          const next = { ...current };
          items.forEach((item) => {
            if (item?.product) next[item.product.id] = item.product;
          });
          return next;
        });
      } else {
        const ids = readGuestWishlist();
        setProductIds(ids);
        await hydrateProducts(ids);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hydrateProducts, isAuthenticated]);

  useEffect(() => {
    if (!isReady) return;
    load();
  }, [isReady, load]);

  // Merge a guest wishlist into the account on sign-in.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return undefined;

    const guestIds = readGuestWishlist();
    if (!guestIds.length) return undefined;

    let active = true;

    wishlistApi
      .addMany(guestIds)
      .then(() => {
        if (!active) return undefined;
        clearGuestWishlist();
        return load();
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isAuthenticated, isReady, load]);


  const toggle = useCallback(
    async (productId) => {
      const wasSaved = productIds.includes(productId);
      setIsMutating(true);

      // Optimistic update so the heart reacts instantly.
      setProductIds((current) =>
        wasSaved ? current.filter((id) => id !== productId) : [...current, productId]
      );

      try {
        if (isAuthenticated) {
          await wishlistApi.toggle(productId);
        } else {
          const next = readGuestWishlist();
          const updated = wasSaved ? next.filter((id) => id !== productId) : [...next, productId];
          writeGuestWishlist(updated);
          setProductIds(updated);
        }

        toast.info(wasSaved ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
        hydrateProducts([productId]);
        return !wasSaved;
      } catch (requestError) {
        // Roll back the optimistic change.
        setProductIds((current) =>
          wasSaved ? [...current, productId] : current.filter((id) => id !== productId)
        );
        toast.error(requestError.message || 'We could not update your wishlist.');
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [hydrateProducts, isAuthenticated, productIds, toast]
  );

  // Drop the previous customer's wishlist from memory on sign out.
  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    setProducts({});
    setProductIds(readGuestWishlist());
  }, [isReady, isAuthenticated]);

  const value = useMemo(() => {
    const items = productIds.map((id) => products[id]).filter(Boolean);

    return {
      productIds,
      items,
      count: productIds.length,
      isLoading,
      isMutating,
      isSaved: (productId) => productIds.includes(productId),
      toggle,
      reload: load,
    };
  }, [productIds, products, isLoading, isMutating, toggle, load]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside a <WishlistProvider>.');
  return context;
}

export default WishlistContext;
