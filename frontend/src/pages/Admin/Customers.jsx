import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Sidebar from '../../components/layout/Sidebar';
import adminService from '../../services/adminService';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatMinutes = (value = 0) => {
  const totalMinutes = Number(value) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedReading, setSelectedReading] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminService.getCustomers({ page, limit: 20 });
        setCustomers(data.customers || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(err?.message || 'Failed to load customers.');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [page]);

  const filteredCustomers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return customers;
    }

    return customers.filter((customer) => {
      const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim().toLowerCase();
      const email = (customer.email || '').toLowerCase();
      return name.includes(needle) || email.includes(needle);
    });
  }, [customers, query]);

  const openCustomerDetail = async (customerId) => {
    setSelectedId(customerId);
    setSelectedDetail(null);
    setSelectedReading(null);
    setDetailLoading(true);

    try {
      const [detail, reading] = await Promise.all([
        adminService.getCustomerById(customerId),
        adminService.getCustomerReading(customerId),
      ]);
      setSelectedDetail(detail);
      setSelectedReading(reading);
    } catch (err) {
      setError(err?.message || 'Failed to load customer details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeCustomerDetail = () => {
    setSelectedId(null);
    setSelectedDetail(null);
    setSelectedReading(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-mocha">Customers</h1>
            <p className="mt-1 text-sm text-charcoal/70">Search users and review orders, spend, and reading progress.</p>
          </div>
          <label className="flex w-full max-w-sm flex-col gap-1 text-xs uppercase tracking-wide text-charcoal/70">
            Search Customer
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or email"
              className="rounded-card border border-taupe/40 bg-oat px-3 py-2 text-sm normal-case text-charcoal"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

        {loading ? (
          <div className="mt-4 rounded-card bg-oat/60 p-6">Loading customers...</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-taupe/40">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Orders</th>
                  <th className="px-3 py-2">Spent</th>
                  <th className="px-3 py-2">Reading</th>
                  <th className="px-3 py-2">Joined</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-taupe/20">
                    <td className="px-3 py-2">{customer.firstName} {customer.lastName}</td>
                    <td className="px-3 py-2">{customer.email}</td>
                    <td className="px-3 py-2">{customer.orderSummary?.totalOrders || 0}</td>
                    <td className="px-3 py-2">{formatCurrency(customer.orderSummary?.totalSpent)}</td>
                    <td className="px-3 py-2">
                      {(customer.readingSummary?.currentlyReading || 0)}
                      {' '}
                      active /
                      {' '}
                      {(customer.readingSummary?.completedBooks || 0)}
                      {' '}
                      completed
                    </td>
                    <td className="px-3 py-2">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="outline" onClick={() => openCustomerDetail(customer._id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredCustomers.length ? (
              <div className="rounded-card bg-oat/50 p-5 text-sm text-charcoal/70">No customers match your search.</div>
            ) : null}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-charcoal/70">
            Page {pagination?.page || page} of {pagination?.totalPages || 1}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={(pagination?.page || page) <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(pagination && (pagination.page >= pagination.totalPages))}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      <Modal
        isOpen={Boolean(selectedId)}
        onClose={closeCustomerDetail}
        title="Customer Details"
      >
        {detailLoading ? (
          <div className="rounded-card bg-oat/50 p-4 text-sm text-charcoal/70">Loading customer details...</div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-card border border-taupe/30 bg-oat/20 p-4">
              <h3 className="font-display text-2xl text-mocha">
                {selectedDetail?.customer?.firstName} {selectedDetail?.customer?.lastName}
              </h3>
              <p className="mt-1 text-sm text-charcoal/70">{selectedDetail?.customer?.email}</p>
              <p className="mt-1 text-xs text-charcoal/60">
                Joined {selectedDetail?.customer?.createdAt ? new Date(selectedDetail.customer.createdAt).toLocaleDateString() : '-'}
              </p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-3">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Total Orders</p>
                <p className="mt-1 text-2xl font-semibold text-mocha">{selectedDetail?.orderSummary?.totalOrders || 0}</p>
              </article>
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-3">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Total Spent</p>
                <p className="mt-1 text-2xl font-semibold text-mocha">{formatCurrency(selectedDetail?.orderSummary?.totalSpent)}</p>
              </article>
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-3">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Currently Reading</p>
                <p className="mt-1 text-2xl font-semibold text-mocha">{selectedReading?.summary?.currentlyReading || 0}</p>
              </article>
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-3">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Reading Time</p>
                <p className="mt-1 text-2xl font-semibold text-mocha">{formatMinutes(selectedReading?.summary?.totalReadingTime)}</p>
              </article>
            </section>

            <section className="rounded-card border border-taupe/30 bg-milk p-3">
              <h4 className="font-display text-xl text-mocha">Recent Orders</h4>
              <div className="mt-2 space-y-2">
                {(selectedDetail?.recentOrders || []).slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between rounded-card bg-oat/30 px-3 py-2 text-sm">
                    <span>{order.orderNumber}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                ))}
                {!selectedDetail?.recentOrders?.length ? (
                  <p className="text-sm text-charcoal/70">No orders yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-card border border-taupe/30 bg-milk p-3">
              <h4 className="font-display text-xl text-mocha">Reading Progress</h4>
              <div className="mt-2 space-y-2">
                {(selectedReading?.readingProgress || []).slice(0, 8).map((row) => (
                  <div key={row._id} className="rounded-card bg-oat/30 px-3 py-2 text-sm">
                    <p className="font-medium text-charcoal">{row.book?.title || 'Unknown title'}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-charcoal/70">
                      <span>{row.progressPercentage || 0}% complete</span>
                      <span>Page {row.currentPage || 0} / {row.totalPages || row.book?.formats?.ebook?.pageCount || 0}</span>
                    </div>
                  </div>
                ))}
                {!selectedReading?.readingProgress?.length ? (
                  <p className="text-sm text-charcoal/70">No reading activity available.</p>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
