import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restores scroll position on navigation:
 *  - normal navigation -> jump to the top
 *  - back/forward      -> restore the previous position
 *  - links with a hash -> scroll that element into view
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    const previous = window.history.state?.scrollY ?? 0;
    const isPopNavigation = window.history.state?.usr?.pop === true;

    if (isPopNavigation && previous) {
      window.scrollTo({ top: previous, behavior: 'auto' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
