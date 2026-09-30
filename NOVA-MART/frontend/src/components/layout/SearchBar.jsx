import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, X, Sparkles } from 'lucide-react';
import { productsApi, aiApi } from '../../lib/api.js';
import { formatCurrency } from '../../lib/format.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import ProductImage from '../ui/ProductImage.jsx';

const DEFAULT_INPUT_CLASSES =
  'h-11 w-full rounded-full border border-ink-200 bg-ink-50 pl-10 pr-10 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus:bg-ink-900';

/**
 * Header search field with live suggestions.
 *
 * @param {{ autoFocus?: boolean, onNavigate?: () => void, className?: string, inputClassName?: string }} props
 */
export function SearchBar({ autoFocus = false, onNavigate, className, inputClassName }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const debouncedTerm = useDebouncedValue(term.trim(), 320);

  // Suggestions for the debounced term.
  useEffect(() => {
    if (debouncedTerm.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);

    productsApi
      .list({ search: debouncedTerm, limit: 5 }, { signal: controller.signal })
      .then((payload) => setSuggestions(payload?.data ?? []))
      .catch((error) => {
        if (error?.name !== 'AbortError') setSuggestions([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedTerm]);

  // Close the panel when clicking outside.
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const categorySuggestions = useMemo(() => {
    if (term.trim().length < 2) return [];
    return [...new Set(suggestions.map((product) => product.category))].slice(0, 3);
  }, [suggestions, term]);

  const submit = (event) => {
    if (event) event.preventDefault();
    const value = term.trim();
    if (!value) return;

    setIsOpen(false);
    onNavigate?.();
    navigate(`/products?search=${encodeURIComponent(value)}`);
  };

  const openProduct = (product) => {
    setTerm('');
    setIsOpen(false);
    onNavigate?.();
    navigate(`/products/${product.slug}`);
  };

  const openCategory = (category) => {
    setIsOpen(false);
    setTerm('');
    onNavigate?.();
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const getAiSuggestions = async () => {
    const value = term.trim();
    if (!value) return;
    setAiBusy(true);
    try {
      const res = await aiApi.assistSearch(value);
      setAiSuggestions(res.suggestions || []);
      setShowAiSuggestions(true);
    } catch (err) {
      console.error('AI search assist failed:', err);
    } finally {
      setAiBusy(false);
    }
  };

  const useAiSuggestion = (suggestion) => {
    setTerm(suggestion);
    setShowAiSuggestions(false);
    setAiSuggestions([]);
    submit();
  };

  const showPanel = isOpen && term.trim().length >= 2;

  return (
    <div ref={containerRef} className={className}>
      <form onSubmit={submit} role="search" className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={term}
          autoFocus={autoFocus}
          onChange={(event) => {
            setTerm(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
              setShowAiSuggestions(false);
              event.currentTarget.blur();
            }
          }}
          placeholder="Search products, brands, categories…"
          aria-label="Search products"
          className={inputClassName ?? DEFAULT_INPUT_CLASSES}
        />

        {term && (
          <>
            <button
              type="button"
              onClick={() => {
                setTerm('');
                setSuggestions([]);
                setShowAiSuggestions(false);
                setAiSuggestions([]);
              }}
              className="absolute right-44 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition hover:bg-ink-200/60 hover:text-ink-700 dark:hover:bg-ink-700"
              aria-label="Clear search"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={getAiSuggestions}
              disabled={aiBusy || !term.trim()}
              className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition hover:bg-ink-200/60 hover:text-ink-700 disabled:opacity-50"
              aria-label="AI search assist"
              title="Get AI search suggestions"
            >
              {aiBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            </button>
          </>
        )}
      </form>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift animate-fade-up dark:border-ink-800 dark:bg-ink-900">
          {isLoading && (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-ink-500 dark:text-ink-400">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Searching…
            </p>
          )}

          {!isLoading && suggestions.length === 0 && (
            <p className="px-4 py-3 text-sm text-ink-500 dark:text-ink-400">
              No products match “{term.trim()}”.
            </p>
          )}

          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => openProduct(product)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800/70"
            >
              <ProductImage
                src={product.image}
                alt={product.name}
                loading="eager"
                className="size-11 shrink-0 rounded-xl"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{product.name}</span>
                <span className="block text-xs text-ink-500 dark:text-ink-400">
                  {product.category}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(product.price)}
              </span>
            </button>
          ))}

          {categorySuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-ink-100 px-3 py-2.5 dark:border-ink-800">
              {categorySuggestions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => openCategory(category)}
                  className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700 transition hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                >
                  in {category}
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={() => submit()}
              className="w-full border-t border-ink-100 bg-ink-50/60 px-4 py-2.5 text-left text-sm font-medium text-brand-700 transition hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-800/40 dark:text-brand-300 dark:hover:bg-ink-800"
            >
              See all results for “{term.trim()}”
            </button>
          )}

          {showAiSuggestions && aiSuggestions.length > 0 && (
            <div className="border-t border-ink-100 px-3 py-2.5 dark:border-ink-800">
              <p className="mb-2 text-xs font-medium text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
                <Sparkles className="size-3.5" aria-hidden="true" />
                AI suggested searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => useAiSuggestion(s)}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAiSuggestions(false)}
                  className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-500 transition hover:bg-ink-100 dark:border-ink-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
