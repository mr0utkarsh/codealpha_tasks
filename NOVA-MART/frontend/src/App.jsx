import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import SiteLayout from './components/layout/SiteLayout.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import { GuestOnlyRoute, ProtectedRoute } from './components/auth/RouteGuards.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { ProductsPage } from './pages/ProductsPage.jsx';
import { ProductDetailPage } from './pages/ProductDetailPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { WishlistPage } from './pages/WishlistPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { AccountPage } from './pages/AccountPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

/**
 * Application shell: providers wrap the router so every screen can reach the
 * theme, toasts, session, bag and wishlist.
 */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ScrollToTop />
                <Routes>
                  <Route element={<SiteLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="products/:slug" element={<ProductDetailPage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="wishlist" element={<WishlistPage />} />
                    <Route
                      path="checkout"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="orders/:orderId/success"
                      element={
                        <ProtectedRoute>
                          <OrderSuccessPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="account"
                      element={
                        <ProtectedRoute>
                          <AccountPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="account/orders"
                      element={
                        <ProtectedRoute>
                          <OrdersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="login"
                      element={
                        <GuestOnlyRoute>
                          <LoginPage />
                        </GuestOnlyRoute>
                      }
                    />
                    <Route
                      path="register"
                      element={
                        <GuestOnlyRoute>
                          <RegisterPage />
                        </GuestOnlyRoute>
                      }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
