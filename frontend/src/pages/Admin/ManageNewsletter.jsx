import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import Sidebar from '../../components/layout/Sidebar';
import adminService from '../../services/adminService';

const FILTERS = ['all', 'active', 'unsubscribed'];

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString();
};

const toCsv = (rows) =>
  rows
    .map((row) =>
      row
        .map((field) => {
          const safeField = String(field ?? '');
          return `"${safeField.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');

export default function ManageNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getNewsletterSubscribers(filter === 'all' ? '' : filter);
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (err) {
      setSubscribers([]);
      setError(err.message || 'Failed to load newsletter subscribers.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getNewsletterStats();
      setStats(data);
    } catch (_err) {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onDelete = async (subscriberId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this subscriber?');
    if (!shouldDelete) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await adminService.deleteNewsletterSubscriber(subscriberId);
      setSuccess('Subscriber deleted successfully.');
      await Promise.all([loadSubscribers(), loadStats()]);
    } catch (err) {
      setError(err.message || 'Failed to delete subscriber.');
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Email', 'Status', 'Subscribed Date'],
      ...subscribers.map((subscriber) => [
        subscriber.email,
        subscriber.status === 'active' ? 'Active' : 'Unsubscribed',
        formatDate(subscriber.subscribedAt),
      ]),
    ];

    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const summaryCards = useMemo(
    () => [
      { label: 'Total Subscribers', value: stats?.total ?? 0 },
      { label: 'Active', value: stats?.active ?? 0 },
      { label: 'Unsubscribed', value: stats?.unsubscribed ?? 0 },
      { label: 'Last 30 Days', value: stats?.recentGrowth ?? 0 },
    ],
    [stats]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-4 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-mocha">Newsletter</h1>
            <p className="mt-1 text-sm text-charcoal/70">
              Track subscriber growth and manage email list hygiene.
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!subscribers.length}>
            Export CSV
          </Button>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <article key={item.label} className="rounded-card border border-taupe/30 bg-oat/30 p-4">
              <p className="text-xs uppercase tracking-wide text-charcoal/70">{item.label}</p>
              <p className="mt-2 font-display text-3xl text-mocha">{item.value}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={[
                'rounded-pill px-4 py-2 text-sm capitalize transition-colors duration-smooth ease-smooth',
                filter === item
                  ? 'bg-mocha text-milk'
                  : 'bg-oat text-mocha hover:bg-taupe hover:text-milk',
              ].join(' ')}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-card border border-taupe/30">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-oat/70">
              <tr>
                <th className="px-3 py-3 font-semibold text-charcoal">Email</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Status</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Subscribed Date</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-charcoal/70" colSpan={4}>
                    Loading subscribers...
                  </td>
                </tr>
              ) : null}

              {!loading && subscribers.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-charcoal/70" colSpan={4}>
                    No subscribers found for the selected filter.
                  </td>
                </tr>
              ) : null}

              {!loading
                ? subscribers.map((subscriber) => (
                    <tr key={subscriber._id} className="border-t border-taupe/20 hover:bg-oat/20">
                      <td className="px-3 py-3 text-charcoal">{subscriber.email}</td>
                      <td className="px-3 py-3">
                        <span
                          className={[
                            'inline-flex rounded-pill px-3 py-1 text-xs',
                            subscriber.status === 'active'
                              ? 'bg-success/15 text-success'
                              : 'bg-charcoal/10 text-charcoal',
                          ].join(' ')}
                        >
                          {subscriber.status === 'active' ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-charcoal/70">{formatDate(subscriber.subscribedAt)}</td>
                      <td className="px-3 py-3">
                        <Button
                          size="sm"
                          className="bg-error text-milk hover:brightness-95"
                          onClick={() => onDelete(subscriber._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
