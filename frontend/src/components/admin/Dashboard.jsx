export default function Dashboard({ stats = {} }) {
  const cards = [
    { label: 'Total Revenue', value: `$${Number(stats.totalRevenue || 0).toFixed(2)}` },
    { label: 'Total Orders', value: stats.totalOrders || 0 },
    { label: 'Total Customers', value: stats.totalCustomers || 0 },
    { label: 'Books Sold', value: stats.totalBooks || 0 },
    { label: 'Active Readers', value: stats.activeReaders || 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article key={card.label} className="rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-charcoal/60">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-mocha">{card.value}</p>
        </article>
      ))}
    </div>
  );
}
