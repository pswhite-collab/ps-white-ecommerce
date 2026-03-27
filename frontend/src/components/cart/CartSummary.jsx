import Button from '../common/Button';

export default function CartSummary({
  itemCount,
  subtotal,
  shipping,
  hasPhysicalItems,
  tax,
  total,
  coupon,
  onCouponChange,
  onApplyCoupon,
  onCheckout,
}) {
  return (
    <aside className="sticky top-24 rounded-card border border-taupe/30 bg-milk p-5 shadow-soft">
      <h3 className="font-display text-3xl text-mocha">Summary</h3>

      <div className="mt-4 space-y-2 text-sm text-charcoal/80">
        <div className="flex justify-between"><span>Subtotal ({itemCount} items)</span><span>{`\u00A3${subtotal.toFixed(2)}`}</span></div>
        {hasPhysicalItems ? (
          <div className="flex justify-between"><span>Shipping</span><span>{`\u00A3${shipping.toFixed(2)}`}</span></div>
        ) : null}
        <div className="flex justify-between"><span>Tax</span><span>{`\u00A3${tax.toFixed(2)}`}</span></div>
        <div className="border-t border-taupe/40 pt-2 text-base font-semibold text-mocha">
          <div className="flex justify-between"><span>Total</span><span>{`\u00A3${total.toFixed(2)}`}</span></div>
        </div>
      </div>

      {hasPhysicalItems ? (
        <div className="mt-3 rounded-card bg-oat/70 p-3 text-xs text-charcoal/80">
          This order contains physical books and requires shipping details at checkout.
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <input
          value={coupon}
          onChange={(event) => onCouponChange(event.target.value)}
          placeholder="Promo code"
          className="w-full rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
        />
        <Button size="sm" variant="outline" onClick={onApplyCoupon}>Apply</Button>
      </div>

      <Button className="mt-4 w-full" onClick={onCheckout}>Proceed to Checkout</Button>
    </aside>
  );
}
