import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx';
import Navbar from './Navbar.jsx';

/**
 * Storefront chrome shared by every public page: announcement strip, sticky
 * header, routed content and footer.
 */
export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main id="main" className="flex-1 animate-fade-in">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default SiteLayout;
