import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/api.js';

/**
 * Small data fetching hook with loading / error / retry support.
 *
 * @template T
 * @param {(options: { signal: AbortSignal }) => Promise<T>} loader
 * @param {unknown[]} deps
 * @param {{ enabled?: boolean, initialData?: T }} [options]
 */
export function useAsyncData(loader, deps = [], options = {}) {
  const { enabled = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [reloadToken, setReloadToken] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(null);

    loaderRef
      .current({ signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((requestError) => {
        if (!active || requestError?.name === 'AbortError') return;
        setError(
          requestError instanceof ApiError || requestError instanceof Error
            ? requestError
            : new Error('Something went wrong.')
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, setData, error, isLoading, refetch };
}

export default useAsyncData;
