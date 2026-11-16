import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '../components/common/Button';
import ShippingAddressForm from '../components/checkout/ShippingAddressForm';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripePublishableKey && stripePublishableKey.startsWith('pk_')
  ? loadStripe(stripePublishableKey)
  : null;

const getInitialShippingAddress = (user) => {
  const saved = user?.shippingAddress || {};
  return {
    firstName: saved.firstName || user?.firstName || '',
    lastName: saved.lastName || user?.lastName || '',
    address: saved.address || saved.street || '',
    addressLine2: saved.addressLine2 || '',
    city: saved.city || '',
    state: saved.state || '',
    country: saved.country || 'United States',
    postalCode: saved.postalCode || '',
    phone: saved.phone || '',
  };
};

function StripeCardForm({
  user,
  email,
  setEmail,
  total,
  hasPhysicalItems,
  onBack,
  createOrder,
  order,
  setOrder,
  clearCart,
  navigate,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onPayNow = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!user && !email.trim()) {
      setError('Please provide your email address for order confirmation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Submit Elements to validate form input
      if (elements) {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          setError(submitError.message || 'Please check your card details.');
          setLoading(false);
          return;
        }
      }

      // 2. Create or reuse existing order (prevents duplicate orders on retry)
      const currentOrder = await createOrder();

      // 3. Create Stripe PaymentIntent on backend
      const intentData = await paymentService.createStripeIntent(currentOrder._id);
      const clientSecret = intentData.clientSecret;

      // 4. Confirm payment with Stripe (or mock if no stripe keys in local test)
      if (stripe && elements && clientSecret && !clientSecret.startsWith('simulated_')) {
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret,
          redirect: 'if_required',
          confirmParams: {
            return_url: `${window.location.origin}/order-success/${currentOrder._id}`,
          },
        });

        if (confirmError) {
          // Card declined, insufficient funds, etc.
          // Keep cart intact so user can retry with a valid card on the same order.
          setError(confirmError.message || 'Payment failed. Please try another payment method.');
          setLoading(false);
          return;
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          await paymentService.confirmStripePayment(currentOrder._id, paymentIntent.id);
        } else if (paymentIntent && paymentIntent.status === 'requires_action') {
          // 3-D Secure handled by Stripe
          return;
        }
      } else {
        // Offline / simulated mode
        await paymentService.confirmStripePayment(
          currentOrder._id,
          intentData.paymentIntentId || `simulated_${Date.now()}`
        );
      }

      clearCart();
      navigate(`/order-success/${currentOrder._id}`);
    } catch (err) {
      const backendError =
        err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.details;
      setError(backendError || err?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onPayNow} className="space-y-4">
      <h2 className="font-display text-3xl text-mocha">Payment Method</h2>
      <p className="text-xs text-mocha/80">Secure payment powered by Stripe</p>

      {!user ? (
        <div>
          <label className="block text-xs font-medium text-mocha mb-1">
            Email for Order Confirmation
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="reader@example.com"
            className="w-full rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm text-charcoal focus:border-mocha focus:outline-none"
          />
        </div>
      ) : null}

      <div className="rounded-card border border-taupe/40 bg-oat/30 p-4">
        {stripePromise ? (
          <PaymentElement />
        ) : (
          <div className="py-4 text-center text-sm text-mocha">
            <p className="font-medium">Stripe Payment Gateway</p>
            <p className="mt-1 text-xs text-charcoal/70">
              Ready to process USD payments via Stripe.
            </p>
          </div>
        )}
      </div>

      {error ? <p className="text-sm font-medium text-error">{error}</p> : null}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    hasPhysicalItems,
    subtotal,
    shipping,
    tax,
    total,
    clearCart,
  } = useCart();

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState(getInitialShippingAddress(user));
  const [email, setEmail] = useState(user?.email || '');
  const [order, setOrder] = useState(null);

  const steps = useMemo(
    () => (hasPhysicalItems ? ['Review Order', 'Shipping Address', 'Payment'] : ['Review Order', 'Payment']),
    [hasPhysicalItems]
  );

  const isPaymentStep = hasPhysicalItems ? step === 3 : step === 2;

  const createOrder = async () => {
    if (order) {
      return order;
    }

    const created = await orderService.createOrder({
      items: items.map((item) => ({
        book: item.bookId,
        format: item.format,
        quantity: item.quantity,
      })),
      shippingAddress: hasPhysicalItems ? shippingAddress : undefined,
      billingAddress: hasPhysicalItems ? { ...shippingAddress, sameAsShipping: true } : undefined,
      paymentMethod: 'stripe',
      guestEmail: user ? undefined : email,
      currency: 'USD',
    });

    setOrder(created);
    return created;
  };

  if (!items.length) {
    return (
      <section className="rounded-card border border-taupe/30 bg-milk p-8 text-center shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Checkout</h1>
        <p className="mt-2 text-charcoal/70">Your cart is empty.</p>
      </section>
    );
  }

  const elementsOptions = {
    mode: 'payment',
    amount: Math.max(50, Math.round(Number(total || 0) * 100)),
    currency: 'usd',
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#685D54',
        colorBackground: '#FBF7F4',
        colorText: '#232323',
      },
    },
  };

  return (
    <div className="max-w-6xl space-y-6">
      <header className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Checkout</h1>
        <p className="mt-2 text-charcoal/70">Complete your purchase in a few steps.</p>
      </header>

      <div className="rounded-card border border-taupe/30 bg-milk p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {steps.map((stepName, index) => {
            const stepNumber = index + 1;
            const active = stepNumber <= step;
            const isLast = stepNumber === steps.length;

            return (
              <div key={stepName} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
                      active ? 'bg-mocha text-milk' : 'bg-oat text-taupe',
                    ].join(' ')}
                  >
                    {stepNumber}
                  </div>
                  <span className={active ? 'text-sm font-medium text-charcoal' : 'text-sm text-taupe'}>
                    {stepName}
                  </span>
                </div>
                {!isLast ? (
                  <div
                    className={[
                      'mx-4 hidden h-0.5 w-14 md:block',
                      stepNumber < step ? 'bg-mocha' : 'bg-oat',
                    ].join(' ')}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 rounded-card border border-taupe/30 bg-milk p-5 shadow-soft">
          {step === 1 ? (
            <div className="space-y-3">
              <h2 className="font-display text-3xl text-mocha">Review Order</h2>
              {items.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between rounded-card border border-taupe/30 bg-oat/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal">{item.title}</p>
                    <p className="text-xs capitalize text-charcoal/70">
                      {item.format} x {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-mocha">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Button onClick={() => setStep(2)} className="w-full">
                {hasPhysicalItems ? 'Continue to Shipping' : 'Continue to Payment'}
              </Button>
            </div>
          ) : null}

          {step === 2 && hasPhysicalItems ? (
            <ShippingAddressForm
              onSubmit={(addressData) => {
                setShippingAddress(addressData);
                setStep(3);
              }}
              initialData={shippingAddress}
            />
          ) : null}

          {isPaymentStep ? (
            stripePromise ? (
              <Elements stripe={stripePromise} options={elementsOptions}>
                <StripeCardForm
                  user={user}
                  email={email}
                  setEmail={setEmail}
                  total={total}
                  hasPhysicalItems={hasPhysicalItems}
                  onBack={() => setStep(hasPhysicalItems ? 2 : 1)}
                  createOrder={createOrder}
                  order={order}
                  setOrder={setOrder}
                  clearCart={clearCart}
                  navigate={navigate}
                />
              </Elements>
            ) : (
              <StripeCardForm
                user={user}
                email={email}
                setEmail={setEmail}
                total={total}
                hasPhysicalItems={hasPhysicalItems}
                onBack={() => setStep(hasPhysicalItems ? 2 : 1)}
                createOrder={createOrder}
                order={order}
                setOrder={setOrder}
                clearCart={clearCart}
                navigate={navigate}
              />
            )
          ) : null}
        </div>

        <aside className="rounded-card border border-taupe/30 bg-milk p-5 shadow-soft lg:sticky lg:top-28">
          <h3 className="font-display text-3xl text-mocha">Order Summary</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-charcoal/80"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {hasPhysicalItems ? (
              <div className="flex justify-between text-charcoal/80"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
            ) : null}
            <div className="flex justify-between text-charcoal/80"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="border-t border-taupe/40 pt-2 text-base font-semibold text-mocha">
              <div className="flex justify-between"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>

          {hasPhysicalItems ? (
            <div className="mt-4 rounded-card bg-oat/60 p-3 text-xs text-charcoal/80">
              Physical books ship within 3-7 business days after payment confirmation.
            </div>
          ) : null}

          {hasPhysicalItems && shippingAddress?.address ? (
            <div className="mt-3 rounded-card bg-oat/50 p-3 text-xs text-charcoal/80">
              <p className="mb-1 font-medium text-charcoal">Shipping to:</p>
              <p>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
              <p>{shippingAddress.address}</p>
              {shippingAddress.addressLine2 ? <p>{shippingAddress.addressLine2}</p> : null}
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
