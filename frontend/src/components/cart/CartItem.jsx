import Button from '../common/Button';

export default function CartItem({ item, onUpdate, onRemove }) {
  return (
    <article className="grid gap-4 rounded-card border border-taupe/30 bg-milk p-4 shadow-soft sm:grid-cols-[110px_1fr_auto]">
      <div className="aspect-[3/4] overflow-hidden rounded-card bg-oat">
        {item.coverImage ? (
          <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-charcoal/60">No cover</div>
        )}
      </div>

      <div>
        <h3 className="font-display text-2xl text-mocha">{item.title}</h3>
        <p className="text-sm text-charcoal/70">{item.author}</p>
        <p className="mt-1 text-sm text-charcoal/60">Format: {item.format}</p>
        <p className="mt-2 text-lg font-semibold text-mocha">${item.price.toFixed(2)}</p>
      </div>

      <div className="flex flex-col items-end justify-between gap-3">
        <div className="inline-flex items-center rounded-pill border border-taupe/50">
          <button type="button" className="px-3 py-1 text-sm" onClick={() => onUpdate(item.itemId, item.quantity - 1)}>-</button>
          <span className="px-3 py-1 text-sm">{item.quantity}</span>
          <button type="button" className="px-3 py-1 text-sm" onClick={() => onUpdate(item.itemId, item.quantity + 1)}>+</button>
        </div>
        <Button size="sm" variant="outline" onClick={() => onRemove(item.itemId)}>
          Remove
        </Button>
      </div>
    </article>
  );
}
