import { productsApi } from '../lib/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { HeroSection } from '../components/home/HeroSection.jsx';
import {
  CategoriesSection,
  FeaturedSection,
  NewsletterCta,
  PromisesSection,
  TrendingSection,
} from '../components/home/HomeSections.jsx';

/** Loads every collection the home page shows. */
function useHomeData() {
  const summary = useAsyncData(() => productsApi.summary().then((payload) => payload.data), [], {
    initialData: null,
  });
  const featured = useAsyncData(
    () => productsApi.list({ featured: true, limit: 8 }).then((payload) => payload.data ?? []),
    [],
    { initialData: [] }
  );
  const trending = useAsyncData(
    () => productsApi.list({ trending: true, limit: 8 }).then((payload) => payload.data ?? []),
    [],
    { initialData: [] }
  );
  const categories = useAsyncData(
    () => productsApi.categories().then((payload) => payload.data ?? []),
    [],
    { initialData: [] }
  );
  const newest = useAsyncData(
    () => productsApi.list({ sort: 'newest', limit: 4 }).then((payload) => payload.data ?? []),
    [],
    { initialData: [] }
  );

  return { summary, featured, trending, categories, newest };
}

/**
 * Storefront home page: hero, promises, categories, featured and trending
 * collections plus a closing call to action.
 */
export function HomePage() {
  const { summary, featured, trending, categories, newest } = useHomeData();
  const heroProducts = (featured.data?.length ? featured.data : trending.data ?? []).slice(0, 3);

  return (
    <>
      <HeroSection summary={summary.data} products={heroProducts} />
      <PromisesSection />
      <CategoriesSection categories={categories.data ?? []} isLoading={categories.isLoading} />
      <FeaturedSection products={featured.data ?? []} isLoading={featured.isLoading} />
      <TrendingSection products={trending.data ?? []} isLoading={trending.isLoading} />
      <NewsletterCta newest={newest.data ?? []} />
    </>
  );
}

export default HomePage;
