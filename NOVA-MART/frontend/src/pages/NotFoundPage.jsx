import { Compass, PackageOpen } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/Feedback.jsx';

/** 404 page - keeps shoppers one click away from the catalogue. */
export function NotFoundPage() {
  return (
    <div className="container py-20">
      <EmptyState
        icon={Compass}
        title="This aisle does not exist"
        description="The page you were looking for has moved or was never stocked. The catalogue is one click away."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink to="/" size="lg">
              Back home
            </ButtonLink>
            <ButtonLink to="/products" variant="secondary" size="lg">
              <PackageOpen className="size-4" aria-hidden="true" />
              Browse products
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}

export default NotFoundPage;
