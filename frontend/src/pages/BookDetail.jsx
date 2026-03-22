const PageShell = ({ title, subtitle }) => (
  <section className="rounded-card border border-taupe/30 bg-milk p-8 shadow-soft">
    <h1 className="font-display text-4xl text-mocha">{title}</h1>
    <p className="mt-3 text-base text-charcoal/70">{subtitle}</p>
  </section>
);

export default function BookDetailPage() {
  return <PageShell title="Book Detail" subtitle="Book detail page placeholder." />;
}
