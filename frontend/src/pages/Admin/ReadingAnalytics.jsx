import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import adminService from '../../services/adminService';

const formatMinutes = (value = 0) => {
  const totalMinutes = Number(value) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};

export default function ReadingAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminService.getReadingAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err?.message || 'Failed to load reading analytics.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-4 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Reading Analytics</h1>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        {loading ? (
          <div className="rounded-card bg-oat/60 p-6">Loading analytics...</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Active Readers</p>
                <p className="mt-2 text-3xl font-semibold text-mocha">{analytics?.activeReaders || 0}</p>
              </article>
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Total Pages Read</p>
                <p className="mt-2 text-3xl font-semibold text-mocha">{analytics?.totalPagesRead || 0}</p>
              </article>
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Total Reading Time</p>
                <p className="mt-2 text-3xl font-semibold text-mocha">{formatMinutes(analytics?.totalReadingTime)}</p>
              </article>
              <article className="rounded-card border border-taupe/30 bg-oat/40 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Avg Completion Rate</p>
                <p className="mt-2 text-3xl font-semibold text-mocha">{analytics?.averageCompletionRate || 0}%</p>
              </article>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-card border border-taupe/30 bg-oat/20 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Books In Progress</p>
                <p className="mt-2 text-2xl font-semibold text-mocha">{analytics?.booksInProgress || 0}</p>
              </article>
              <article className="rounded-card border border-taupe/30 bg-oat/20 p-4">
                <p className="text-xs uppercase tracking-wide text-charcoal/60">Books Completed</p>
                <p className="mt-2 text-2xl font-semibold text-mocha">{analytics?.booksCompleted || 0}</p>
              </article>
            </div>

            <section className="rounded-card border border-taupe/30 bg-oat/20 p-4">
              <h2 className="font-display text-2xl text-mocha">Most Read Books</h2>
              <div className="mt-3 space-y-2">
                {(analytics?.mostReadBooks || []).map((item) => (
                  <div key={item.bookId} className="rounded-card bg-milk px-3 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-charcoal">{item.title || 'Unknown title'}</p>
                      <span className="text-mocha">{item.readers || 0} readers</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-charcoal/70">
                      <span>{item.averageProgress || 0}% avg progress</span>
                      <span>{formatMinutes(item.averageReadingTime || 0)} avg time</span>
                    </div>
                  </div>
                ))}

                {!analytics?.mostReadBooks?.length ? (
                  <p className="text-sm text-charcoal/70">No reading activity found yet.</p>
                ) : null}
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}
