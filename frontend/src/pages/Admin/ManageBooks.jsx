import Sidebar from '../../components/layout/Sidebar';

export default function ManageBooks() {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="rounded-card border border-taupe/30 bg-milk p-8 shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Manage Books</h1>
        <p className="mt-3 text-charcoal/70">Manage books page placeholder.</p>
      </section>
    </div>
  );
}
