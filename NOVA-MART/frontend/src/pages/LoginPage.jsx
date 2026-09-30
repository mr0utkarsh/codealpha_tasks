import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button, { ButtonLink } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Field.jsx';
import { InlineAlert } from '../components/ui/Feedback.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign-in screen. Redirects to the page the visitor originally asked for via
 * `location.state.from`, falling back to the account area.
 */
export function LoginPage() {
  const { login, isAuthenticated, isReady } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname ?? '/account';

  const [values, setValues] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isReady, isAuthenticated, redirectTo, navigate]);

  const update = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.';
    if (!values.password) errors.password = 'Enter your password.';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const user = await login({ email: values.email.trim(), password: values.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setFieldErrors(requestError.fieldErrors ?? {});
      setFormError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container grid gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
      <div className="mx-auto w-full max-w-md">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
          Welcome back
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold">Sign in to NOVA MART</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
          Pick up where you left off - your bag, wishlist and orders are waiting.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          {formError && (
            <InlineAlert tone="danger" title="We could not sign you in">
              {formError}
            </InlineAlert>
          )}

          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={values.email}
            onChange={update('email')}
            error={fieldErrors.email}
            autoComplete="email"
            required
          />

          <Input
            label={showPassword ? 'Password (visible)' : 'Password'}
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="••••••••"
            value={values.password}
            onChange={update('password')}
            error={fieldErrors.password}
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-ink-600 dark:text-ink-300">
              <input
                type="checkbox"
                className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/30 dark:border-ink-600"
              />
              Keep me signed in
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="inline-flex items-center gap-1.5 text-ink-500 transition hover:text-ink-800 dark:hover:text-ink-200"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-600 dark:text-ink-300">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Create an account
          </Link>
        </p>
      </div>

      <aside className="hidden lg:flex lg:flex-col lg:justify-center lg:rounded-4xl lg:border lg:border-ink-100 lg:bg-ink-50 lg:p-10 dark:lg:border-ink-800 dark:lg:bg-ink-950/40">
        <Sparkles className="size-8 text-brand-600 dark:text-brand-400" aria-hidden="true" />
        <h2 className="mt-5 text-balance text-2xl font-bold">
          Members get first pick, better prices and a faster checkout.
        </h2>
        <ul className="mt-6 space-y-3 text-sm text-ink-600 dark:text-ink-300">
          {[
            '15% off your first order with a free account',
            'Bag and wishlist synced across every device',
            'Order tracking, returns and invoices in one place',
            'Early access to seasonal drops and members-only pricing',
          ].map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <ButtonLink to="/products" variant="secondary" size="lg">
            Keep browsing as a guest
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}

export default LoginPage;

