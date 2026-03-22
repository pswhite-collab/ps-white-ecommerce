import Sidebar from '../../components/layout/Sidebar';

export default function AdminDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="rounded-card border border-taupe/30 bg-milk p-8 shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Admin Dashboard</h1>
        <p className="mt-3 text-charcoal/70">Admin dashboard page placeholder.</p>
      </section>
    </div>
  );
}
