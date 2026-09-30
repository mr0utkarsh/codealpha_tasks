import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageLoader } from '../ui/Feedback.jsx';

/**
 * Wraps routes that require a signed-in customer. Guests are redirected to the
 * sign-in page with the intended destination preserved.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <PageLoader label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
}

/**
 * Wraps routes that should not be reachable while signed in (sign in / register).
 */
export function GuestOnlyRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <PageLoader label="Checking your session…" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/account/orders" replace />;
  }

  return children;
}

export default ProtectedRoute;
