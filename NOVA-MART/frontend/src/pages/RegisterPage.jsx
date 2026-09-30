import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gift, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button, { ButtonLink } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Field.jsx';
import { InlineAlert } from '../components/ui/Feedback.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/** Registration screen with inline validation before the API call. */
export function RegisterPage() {
  const { register, isAuthenticated, isReady } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname ?? '/account';

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
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
    if (values.name.trim().length < 2) errors.name = 'Enter your full name.';
    if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.';
    if (values.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const user = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success(`Welcome to NOVA MART, ${user.name.split(' ')[0]}.`);
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
      <aside className="order-2 hidden lg:flex lg:flex-col lg:justify-center lg:rounded-4xl lg:border lg:border-ink-100 lg:bg-ink-50 lg:p-10 dark:lg:border-ink-800 dark:lg:bg-ink-950/40">
        <Gift className="size-8 text-brand-600 dark:text-brand-400" aria-hidden="true" />
        <h2 className="mt-5 text-balance text-2xl font-bold">
          Join the list and take 15% off your first order.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
          One account for the bag you build on your phone, the wishlist you curate on your laptop and
          every order you place in between.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4">
          {[
            ['15%', 'off your first order'],
            ['30 days', 'free returns'],
            ['2 years', 'warranty included'],
            ['24 h', 'dispatch window'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-white p-4 dark:bg-ink-900/60">
              <dt className="font-display text-xl font-bold">{value}</dt>
              <dd className="mt-1 text-xs text-ink-500 dark:text-ink-400">{label}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8">
          <ButtonLink to="/products" variant="secondary" size="lg">
            Keep browsing as a guest
          </ButtonLink>
        </div>
      </aside>

      <div className="order-1 mx-auto w-full max-w-md">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
          Create your account
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold">Start shopping smarter</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
          Takes less than a minute - and your guest bag comes with you.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          {formError && (
            <InlineAlert tone="danger" title="We could not create your account">
              {formError}
            </InlineAlert>
          )}

          <Input label="Full name" icon={User} placeholder="Ada Lovelace" value={values.name} onChange={update('name')} error={fieldErrors.name} autoComplete="name" required />

          <Input label="Email" type="email" icon={Mail} placeholder="you@example.com" value={values.email} onChange={update('email')} error={fieldErrors.email} autoComplete="email" required />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={values.password}
            onChange={update('password')}
            error={fieldErrors.password}
            autoComplete="new-password"
            hint={`Use at least ${MIN_PASSWORD_LENGTH} characters with a mix of letters and numbers.`}
            required
          />

          <Input label="Confirm password" type="password" icon={Lock} placeholder="Repeat your password" value={values.confirmPassword} onChange={update('confirmPassword')} error={fieldErrors.confirmPassword} autoComplete="new-password" required />

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-600 dark:text-ink-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;

