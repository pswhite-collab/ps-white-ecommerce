export default function ReadingStats({ stats }) {
  const cards = [
    { label: 'Total Books', value: stats.totalBooks || 0 },
    { label: 'Currently Reading', value: stats.currentlyReading || 0 },
    { label: 'Books Completed', value: stats.booksCompleted || 0 },
    { label: 'Pages Read', value: stats.totalPagesRead || 0 },
    { label: 'Reading Time', value: stats.readingTimeLabel || '0h 0m' },
  ];

  return (
    <section className="rounded-card border border-taupe/30 bg-oat/70 p-5 shadow-soft">
      <h2 className="font-display text-3xl text-mocha">Reading Stats</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-card bg-milk p-3">
            <p className="text-xs uppercase tracking-wide text-charcoal/60">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-mocha">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
