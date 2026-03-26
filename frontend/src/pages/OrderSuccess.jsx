import { useEffect, useState } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import { useCart } from '../context/CartContext';
import paymentService from '../services/paymentService';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    const verifyStripePayment = async () => {
      if (!sessionId) {
        clearCart();
        return;
      }

      try {
        setStatus('verifying');
        await paymentService.confirmStripePayment(orderId, undefined, sessionId);
        clearCart();
        setStatus('ready');
      } catch (err) {
        setError(err.message || 'Unable to verify Stripe payment.');
        setStatus('error');
      }
    };

    verifyStripePayment();
  }, [clearCart, orderId, searchParams]);

  return (
    <section className="mx-auto max-w-2xl rounded-card border border-taupe/30 bg-milk p-8 text-center shadow-soft">
      <h1 className="font-display text-5xl text-mocha">Order Successful</h1>
      <p className="mt-3 text-charcoal/70">
        {status === 'verifying'
          ? 'Verifying your Stripe payment...'
          : 'Thank you for your purchase. Your order has been confirmed.'}
      </p>
      {status === 'error' ? <p className="mt-2 text-sm text-error">{error}</p> : null}
      <p className="mt-2 text-sm text-charcoal/60">Order ID: {orderId}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/library"><Button>Go to Library</Button></Link>
        <Link to="/books"><Button variant="outline">Continue Shopping</Button></Link>
      </div>
    </section>
  );
}
