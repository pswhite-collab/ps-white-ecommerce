import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import ShippingAddressForm from '../components/checkout/ShippingAddressForm';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const isRazorpayMethod = (method) => method === 'razorpay';

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
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      paymentMethod,
      guestEmail: user ? undefined : email,
      currency: isRazorpayMethod(paymentMethod) ? 'INR' : 'USD',
    });

    setOrder(created);
    return created;
  };

  const handleRazorpayPayment = async (createdOrder) => {
    const loaded = await loadRazorpayScript();
    const data = await paymentService.createRazorpayOrder(createdOrder._id);

    if (loaded && window.Razorpay) {
      return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: 'PS White Books',
          order_id: data.orderId,
          handler: async (response) => {
            try {
              await paymentService.verifyRazorpayPayment({
                orderId: createdOrder._id,
                ...response,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          prefill: {
            email,
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() || user?.firstName || '',
          },
          theme: { color: '#685D54' },
        });

        razorpay.on('payment.failed', (event) => {
          reject(new Error(event?.error?.description || 'Payment failed'));
        });

        razorpay.open();
      });
    }

    await paymentService.verifyRazorpayPayment({
      orderId: createdOrder._id,
      razorpay_order_id: data.orderId,
      razorpay_payment_id: `simulated_${Date.now()}`,
      razorpay_signature: 'simulated',
    });
  };

  const handleStripePayment = async (createdOrder) => {
    const intent = await paymentService.createStripeIntent(createdOrder._id);
    await paymentService.confirmStripePayment(
      createdOrder._id,
      intent.clientSecret || `stripe_${Date.now()}`
    );
  };

  const handlePayPalPayment = async (createdOrder) => {
    const data = await paymentService.createPayPalOrder(createdOrder._id);

    if (data.approveUrl) {
      window.open(data.approveUrl, '_blank', 'noopener,noreferrer');
      const approved = window.confirm(
        'After approving the payment in PayPal, click OK to finalize this order.'
      );

      if (!approved) {
        throw new Error('PayPal approval cancelled by user.');
      }
    }

    await paymentService.capturePayPalOrder(createdOrder._id, data.paypalOrderId);
  };

  const onPayNow = async () => {
    setLoading(true);
    setError('');

    try {
      const createdOrder = await createOrder();

      if (paymentMethod === 'stripe') {
        await handleStripePayment(createdOrder);
      } else if (paymentMethod === 'paypal') {
        await handlePayPalPayment(createdOrder);
      } else {
        await handleRazorpayPayment(createdOrder);
      }

      clearCart();
      navigate(`/order-success/${createdOrder._id}`);
    } catch (err) {
      const backendError =
        err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.details;
      setError(backendError || err?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <section className="rounded-card border border-taupe/30 bg-milk p-8 text-center shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Checkout</h1>
        <p className="mt-2 text-charcoal/70">Your cart is empty.</p>
      </section>
    );
  }

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
                      {item.format}
                      {' '}
                      x
                      {' '}
                      {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-mocha">
                    $
                    {(item.price * item.quantity).toFixed(2)}
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
            <div className="space-y-4">
              <h2 className="font-display text-3xl text-mocha">Payment Method</h2>

              {!user ? (
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email for order confirmation"
                  className="w-full rounded-card border border-taupe/50 bg-oat px-3 py-2"
                />
              ) : null}

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-card border border-taupe/40 bg-oat/50 px-3 py-2">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                  />
                  Razorpay
                </label>
                <label className="flex items-center gap-2 rounded-card border border-taupe/40 bg-oat/50 px-3 py-2">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                  />
                  Stripe
                </label>
                <label className="flex items-center gap-2 rounded-card border border-taupe/40 bg-oat/50 px-3 py-2">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                  />
                  PayPal
                </label>
              </div>

              {error ? <p className="text-sm text-error">{error}</p> : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(hasPhysicalItems ? 2 : 1)}
                >
                  Back
                </Button>
                <Button disabled={loading} onClick={onPayNow} className="flex-1">
                  {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-card border border-taupe/30 bg-milk p-5 shadow-soft lg:sticky lg:top-4">
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
                {shippingAddress.firstName}
                {' '}
                {shippingAddress.lastName}
              </p>
              <p>{shippingAddress.address}</p>
              {shippingAddress.addressLine2 ? <p>{shippingAddress.addressLine2}</p> : null}
              <p>
                {shippingAddress.city}
                ,
                {' '}
                {shippingAddress.state}
                {' '}
                {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
