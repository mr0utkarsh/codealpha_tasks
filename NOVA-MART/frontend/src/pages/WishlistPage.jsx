import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/Feedback.jsx';
import { ProductGrid } from '../components/product/ProductGrid.jsx';

/**
 * Saved pieces for guests and members alike - the context keeps both in sync.
 */
export function WishlistPage() {
  const { items, count, isLoading } = useWishlist();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
        title="Your wishlist"
        description={
          count
            ? `${count} ${count === 1 ? 'piece' : 'pieces'} saved for later. Items stay here whether you are signed in or not.`
            : 'Tap the heart on any product to keep it here until you are ready.'
        }
        actions={
          <ButtonLink to="/products" variant="secondary">
            Browse the catalogue
          </ButtonLink>
        }
      />

      <div className="container py-10">
        {!isLoading && items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Your wishlist is the place for the pieces you are thinking about. Fill it up and come back anytime."
            action={
              <ButtonLink to="/products" size="lg">
                Find something to love
              </ButtonLink>
            }
          />
        ) : (
          <ProductGrid
            products={items}
            isLoading={isLoading}
            skeletonCount={8}
            columns="lg"
            priorityCount={4}
          />
        )}
      </div>
    </>
  );
}

export default WishlistPage;
