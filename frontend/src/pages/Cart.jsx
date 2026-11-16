import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    hasPhysicalItems,
    subtotal,
    shipping,
    tax,
    total,
  } = useCart();
  const [coupon, setCoupon] = useState('');

  if (items.length === 0) {
    return (
      <section className="rounded-card border border-taupe/30 bg-milk p-8 text-center shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Your cart is empty</h1>
        <p className="mt-2 text-charcoal/70">Browse books and add your first title.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h1 className="font-display text-4xl text-mocha">Shopping Cart</h1>
        {items.map((item) => (
          <CartItem
            key={item.itemId}
            item={item}
            onUpdate={updateQuantity}
            onRemove={removeFromCart}
          />
        ))}
      </div>

      <CartSummary
        itemCount={items.reduce((count, item) => count + item.quantity, 0)}
        subtotal={subtotal}
        shipping={shipping}
        hasPhysicalItems={hasPhysicalItems}
        tax={tax}
        total={total}
        coupon={coupon}
        onCouponChange={setCoupon}
        onApplyCoupon={() => {
          // Placeholder for coupon logic
          alert('Coupon support will be added in Day 4 polish.');
        }}
        onCheckout={() => navigate('/checkout')}
      />
    </section>
  );
}
