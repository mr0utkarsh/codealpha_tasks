import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import { productsApi } from '../lib/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { getCategoryCopy } from '../data/categoryCopy.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import { ProductFilters, SORT_OPTIONS } from '../components/product/ProductFilters.jsx';
import { ProductGrid } from '../components/product/ProductGrid.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import Pagination from '../components/ui/Pagination.jsx';

const PAGE_SIZE = 12;
const SORT_VALUES = new Set(SORT_OPTIONS.map((option) => option.value));

/** Parses the public filter contract into typed values for the UI. */
function readFilters(searchParams) {
  const toNumber = (value) => {
    if (value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const sort = searchParams.get('sort');

  return {
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    sort: sort && SORT_VALUES.has(sort) ? sort : 'relevance',
    minPrice: toNumber(searchParams.get('minPrice')),
    maxPrice: toNumber(searchParams.get('maxPrice')),
    minRating: toNumber(searchParams.get('minRating')),
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
    featured: searchParams.get('featured') === 'true' ? true : undefined,
    trending: searchParams.get('trending') === 'true' ? true : undefined,
    page: Number(searchParams.get('page') ?? 1) || 1,
  };
}

/**
 * Catalogue page. Filters, sorting and pagination all live in the URL so every
 * view is shareable, linkable and survives a refresh.
 */
export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  // Serialising the filters gives the data hook a stable dependency list.
  const key = JSON.stringify(filters);

  const categories = useAsyncData(
    () => productsApi.categories().then((payload) => payload.data ?? []),
    [],
    { initialData: [] }
  );

  const products = useAsyncData(
    ({ signal }) =>
      productsApi
        .list({ ...filters, limit: PAGE_SIZE }, { signal })
        .then((payload) => ({ items: payload?.data ?? [], meta: payload?.meta ?? null })),
    [key],
    { initialData: { items: [], meta: null } }
  );

  const updateFilters = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(patch).forEach(([name, value]) => {
        if (value === undefined || value === null || value === '' || value === false) next.delete(name);
        else next.set(name, String(value));
      });

      // Any filter change resets paging unless the caller set it explicitly.
      if (!('page' in patch)) next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  const categoryCopy = filters.category ? getCategoryCopy(filters.category) : null;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: filters.category || 'Shop' }]}
        title={
          filters.category || (filters.search ? `Results for “${filters.search}”` : 'All products')
        }
        description={
          filters.category
            ? categoryCopy.tagline
            : 'Considered pieces across ten departments. Filter by price, rating or availability to find the one.'
        }
      />

      <div className="container grid gap-10 py-10 lg:grid-cols-[17rem_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <ProductFilters
            categories={categories.data ?? []}
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            resultCount={products.isLoading ? undefined : products.data?.meta?.total ?? 0}
          />
        </div>

        <ProductsResults
          state={products}
          minRating={filters.minRating}
          pageSize={PAGE_SIZE}
          onReset={resetFilters}
          onPageChange={(page) => {
            updateFilters({ page });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </>
  );
}

/**
 * Results column: applies the optional minimum rating (not part of the public
 * list query) and renders the grid, pagination and empty / error states.
 */
function ProductsResults({ state, minRating, pageSize, onReset, onPageChange }) {
  const { data, error, isLoading, refetch } = state;

  const items = useMemo(() => {
    const loaded = data?.items ?? [];
    if (!minRating) return loaded;
    return loaded.filter((product) => product.rating >= minRating);
  }, [data, minRating]);

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!isLoading && items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No products match those filters"
        description="Try widening the price range, clearing the rating filter or searching for something else."
        action={
          <Button variant="secondary" onClick={onReset}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Clear all filters
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <ProductGrid
        products={items}
        isLoading={isLoading}
        skeletonCount={pageSize}
        columns="lg"
        priorityCount={4}
      />

      {data?.meta && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}

export default ProductsPage;
