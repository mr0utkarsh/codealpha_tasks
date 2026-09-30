import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  authApi,
  getAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
  TOKEN_STORAGE_KEY,
} from '../lib/api.js';

const AuthContext = createContext(null);

/**
 * Authentication state for the storefront.
 *
 * A JWT is kept in localStorage, validated against `GET /api/auth/me` on boot
 * and cleared automatically when the API reports the session as invalid.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (getAuthToken() ? 'loading' : 'guest'));
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setStatus('guest');
  }, []);

  // Validate the stored token once on mount.
  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setStatus('guest');
      return;
    }

    const controller = new AbortController();

    authApi
      .me({ signal: controller.signal })
      .then((payload) => {
        if (!mounted.current) return;
        setUser(payload.data.user);
        setStatus('authenticated');
      })
      .catch((requestError) => {
        if (!mounted.current || requestError?.name === 'AbortError') return;
        clearSession();
      });

    return () => controller.abort();
  }, [clearSession]);

  // Global 401 handling: drop the session but keep the visitor on the page.
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== TOKEN_STORAGE_KEY) return;
      if (!event.newValue) clearSession();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const payload = await authApi.login(credentials);
    setAuthToken(payload.data.token);
    setUser(payload.data.user);
    setStatus('authenticated');
    return payload.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const payload = await authApi.register(details);
    setAuthToken(payload.data.token);
    setUser(payload.data.user);
    setStatus('authenticated');
    return payload.data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (details) => {
    const payload = await authApi.updateProfile(details);
    setUser(payload.data.user);
    return payload.data.user;
  }, []);

  const changePassword = useCallback((details) => authApi.changePassword(details), []);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      isAuthenticated: status === 'authenticated',
      isReady: status !== 'loading',
      isAdmin: user?.role === 'ADMIN',
      setError,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, status, error, login, register, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return context;
}

export default AuthContext;
