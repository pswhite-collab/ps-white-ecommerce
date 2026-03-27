import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Dashboard from '../../components/admin/Dashboard';
import adminService from '../../services/adminService';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const dashboard = await adminService.getDashboard();
        setData(dashboard);
      } catch (_error) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-5">
        <header className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
          <h1 className="font-display text-4xl text-mocha">Admin Dashboard</h1>
          <p className="mt-2 text-charcoal/70">Track store health, orders, and reading engagement.</p>
        </header>

        {loading ? <div className="rounded-card bg-oat/60 p-8">Loading dashboard...</div> : null}

        {!loading && data ? (
          <>
            <Dashboard stats={data.stats || {}} />

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
                <h2 className="font-display text-2xl text-mocha">Recent Orders</h2>
                <div className="mt-3 space-y-2">
                  {(data.recentOrders || []).map((order) => (
                    <div key={order._id} className="flex items-center justify-between rounded-card bg-oat/40 px-3 py-2 text-sm">
                      <span>{order.orderNumber}</span>
                      <span>{`\u00A3${order.total?.toFixed(2)}`}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
                <h2 className="font-display text-2xl text-mocha">Top Selling Books</h2>
                <div className="mt-3 space-y-2">
                  {(data.topBooks || []).map((book) => (
                    <div key={book._id} className="flex items-center justify-between rounded-card bg-oat/40 px-3 py-2 text-sm">
                      <span>{book.title}</span>
                      <span>{book.totalSales || 0} sold</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
