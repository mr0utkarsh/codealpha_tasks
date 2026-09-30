import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShoppingBag } from 'lucide-react';
import { ordersApi } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { cn, formatCurrency } from '../lib/format.js';
import Button, { ButtonLink } from '../components/ui/Button.jsx';
import { Input, Textarea } from '../components/ui/Field.jsx';
import { InlineAlert, EmptyState } from '../components/ui/Feedback.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { OrderSummaryCard } from '../components/cart/OrderSummaryCard.jsx';

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Credit / debit card', hint: 'Visa, Mastercard, Amex' },
  { value: 'PAYPAL', label: 'PayPal', hint: 'Redirects after review' },
  { value: 'COD', label: 'Cash on delivery', hint: 'Pay when it arrives' },
];

const EMPTY_ADDRESS = {
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States',
};

/**
 * Checkout: shipping address, payment choice and the final order summary.
 * Guests are asked to sign in first so the order can be tracked.
 */
export function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, summary, clearCart, isLoading: cartLoading } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    fullName: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (name) => (event) => {
    setAddress((current) => ({ ...current, [name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload = await ordersApi.create({ shippingAddress: address, paymentMethod, notes });
      // The API responds with { success, data: { order } }.
      const order = payload?.data?.order ?? payload?.data;
      if (!order?.id) throw new Error('The order confirmation is missing an order reference.');

      await clearCart();
      toast.success('Your order has been placed.');
      navigate(`/orders/${order.id}/success`, { replace: true, state: { order } });
    } catch (requestError) {
      setFieldErrors(requestError.fieldErrors ?? {});
      setSubmitError(requestError.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const cartIsEmpty = cartLoading ? false : items.length === 0;

  if (!isAuthenticated) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <EmptyState
          icon={Lock}
          title="Sign in to complete your order"
          description="Orders are tied to an account so you can track them, request returns and reorder in one click."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/login" size="lg">Sign in</ButtonLink>
              <ButtonLink to="/register" variant="secondary" size="lg">Create account</ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  if (cartIsEmpty && !isSubmitting) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add a few pieces before heading to checkout."
          action={<ButtonLink to="/products" size="lg">Start shopping</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <PageHeader
        className="border-0 bg-transparent p-0"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Cart', to: '/cart' },
          { label: 'Checkout' },
        ]}
        title="Checkout"
        description="Review your bag, tell us where it is going and choose how you would like to pay."
      />

      <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_23rem] lg:gap-12">
        <div className="space-y-8">
          {submitError && (
            <InlineAlert tone="danger" title="We could not place your order">
              {submitError}
            </InlineAlert>
          )}

          <section className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-ink-950 text-xs font-bold text-white dark:bg-white dark:text-ink-950">1</span>
              Shipping address
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input label="Full name" name="fullName" value={address.fullName} onChange={update('fullName')} error={fieldErrors.fullName} autoComplete="name" required />
              <Input label="Email" type="email" name="email" value={address.email} onChange={update('email')} error={fieldErrors.email} autoComplete="email" required />
              <Input label="Phone" name="phone" value={address.phone} onChange={update('phone')} error={fieldErrors.phone} autoComplete="tel" required />
              <Input label="Postal code" name="postalCode" value={address.postalCode} onChange={update('postalCode')} error={fieldErrors.postalCode} autoComplete="postal-code" required />
              <div className="sm:col-span-2">
                <Input label="Street address" name="addressLine1" value={address.addressLine1} onChange={update('addressLine1')} error={fieldErrors.addressLine1} autoComplete="address-line1" required />
              </div>
              <div className="sm:col-span-2">
                <Input label="Apartment, suite, etc. (optional)" name="addressLine2" value={address.addressLine2} onChange={update('addressLine2')} error={fieldErrors.addressLine2} autoComplete="address-line2" />
              </div>
              <Input label="City" name="city" value={address.city} onChange={update('city')} error={fieldErrors.city} autoComplete="address-level2" required />
              <Input label="State / region" name="state" value={address.state} onChange={update('state')} error={fieldErrors.state} autoComplete="address-level1" required />
              <div className="sm:col-span-2">
                <Input label="Country" name="country" value={address.country} onChange={update('country')} error={fieldErrors.country} autoComplete="country-name" required />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-ink-950 text-xs font-bold text-white dark:bg-white dark:text-ink-950">2</span>
              Payment method
            </h2>

            <div className="mt-6 grid gap-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition',
                    paymentMethod === method.value
                      ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10 dark:bg-brand-500/10'
                      : 'border-ink-200 bg-white hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900/40'
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="size-4 border-ink-300 text-brand-600 focus:ring-brand-500/30 dark:border-ink-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{method.label}</span>
                    <span className="block text-xs text-ink-500 dark:text-ink-400">{method.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-5">
              <Textarea
                label="Order notes (optional)"
                hint="Delivery instructions, gate codes, gift messages…"
                name="notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Please leave with the concierge."
                maxLength={500}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-ink-950 text-xs font-bold text-white dark:bg-white dark:text-ink-950">3</span>
              Review and place
            </h2>
            <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">
              Pay securely with {PAYMENT_METHODS.find((method) => method.value === paymentMethod)?.label.toLowerCase()}.
              Your card details are never stored by NOVA MART.
            </p>

            <Button
              type="submit"
              size="lg"
              fullWidth
              className="mt-5"
              isLoading={isSubmitting}
              disabled={cartLoading}
            >
              Place order · {formatCurrency(summary.total)}
            </Button>

            <p className="mt-3 text-center text-xs text-ink-400">
              By placing this order you agree to our terms of sale and privacy policy.
            </p>
          </section>
        </div>

        <div className="lg:sticky lg:top-28 lg:h-fit">
          <OrderSummaryCard summary={summary} items={items} showItems />
          <p className="mt-4 text-center text-xs text-ink-400">
            Need a hand?{' '}
            <Link to="/account/orders" className="font-medium text-brand-600 hover:underline">
              Track a previous order
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;

