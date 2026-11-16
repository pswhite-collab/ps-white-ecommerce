import { Link, useParams } from 'react-router-dom';
import Button from '../components/common/Button';

export default function OrderSuccess() {
  const { orderId } = useParams();

  return (
    <section className="mx-auto max-w-2xl rounded-card border border-taupe/30 bg-milk p-8 text-center shadow-soft">
      <h1 className="font-display text-5xl text-mocha">Order Successful</h1>
      <p className="mt-3 text-charcoal/70">Thank you for your purchase. Your order has been confirmed.</p>
      <p className="mt-2 text-sm text-charcoal/60">Order ID: {orderId}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/library"><Button>Go to Library</Button></Link>
        <Link to="/books"><Button variant="outline">Continue Shopping</Button></Link>
      </div>
    </section>
  );
}
