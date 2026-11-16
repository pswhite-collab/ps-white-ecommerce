import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import Sidebar from '../../components/layout/Sidebar';
import reviewService from '../../services/reviewService';

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const renderStars = (rating) =>
  [1, 2, 3, 4, 5].map((star) => (
    <span key={star} className={star <= rating ? 'text-warning' : 'text-charcoal/30'}>
      ★
    </span>
  ));

const statusBadgeClass = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-error/15 text-error',
};

const getReviewerName = (user) => {
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  if (fullName) {
    return fullName;
  }
  return user?.email || 'Anonymous Reader';
};

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await reviewService.getAdminReviews({
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
      });
      setReviews(payload.reviews || []);
      setStatusCounts(payload.statusCounts || { all: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setReviews([]);
      setError(err.message || 'Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const runAction = async (reviewId, actionFn, successMessage) => {
    setBusyId(reviewId);
    setError('');
    setSuccess('');
    try {
      await actionFn(reviewId);
      setSuccess(successMessage);
      await loadReviews();
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setBusyId('');
    }
  };

  const onDelete = async (reviewId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this review?');
    if (!shouldDelete) {
      return;
    }
    await runAction(reviewId, reviewService.deleteReview, 'Review deleted successfully.');
  };

  const summaryCards = useMemo(
    () => [
      { label: 'Total Reviews', value: statusCounts.all, color: 'text-charcoal' },
      { label: 'Pending', value: statusCounts.pending, color: 'text-warning' },
      { label: 'Approved', value: statusCounts.approved, color: 'text-success' },
      { label: 'Rejected', value: statusCounts.rejected, color: 'text-error' },
    ],
    [statusCounts]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-4 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <header>
          <h1 className="font-display text-4xl text-mocha">Manage Reviews</h1>
          <p className="mt-1 text-sm text-charcoal/70">
            Approve trusted feedback and hide spam or inappropriate content.
          </p>
        </header>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <article key={item.label} className="rounded-card border border-taupe/30 bg-oat/30 p-4">
              <p className="text-xs uppercase tracking-wide text-charcoal/70">{item.label}</p>
              <p className={`mt-2 font-display text-3xl ${item.color}`}>{item.value}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={[
                  'rounded-pill px-4 py-2 text-sm capitalize transition-colors duration-smooth ease-smooth',
                  filter === status
                    ? 'bg-mocha text-milk'
                    : 'bg-oat text-mocha hover:bg-taupe hover:text-milk',
                ].join(' ')}
              >
                {status}
                {status !== 'all' ? ` (${statusCounts[status] || 0})` : ''}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or comment..."
            className="w-full rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm md:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="rounded-card bg-oat/50 p-5 text-sm text-charcoal/70">Loading reviews...</div>
        ) : null}

        {!loading && !reviews.length ? (
          <div className="rounded-card bg-oat/50 p-5 text-sm text-charcoal/70">No reviews found.</div>
        ) : null}

        {!loading
          ? reviews.map((review) => (
              <article key={review._id} className="rounded-card border border-taupe/30 bg-milk p-5 shadow-soft">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {review.book?.coverImage?.url ? (
                        <img
                          src={review.book.coverImage.url}
                          alt={review.book.title || 'Book cover'}
                          className="h-16 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-16 w-12 rounded bg-oat" />
                      )}
                      <div>
                        <p className="font-semibold text-charcoal">{review.book?.title || 'Unknown Book'}</p>
                        <p className="text-xs text-charcoal/70">
                          by {getReviewerName(review.user)} • {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex gap-1 text-lg">{renderStars(review.rating)}</div>
                      <span
                        className={`inline-flex rounded-pill px-3 py-1 text-xs ${
                          statusBadgeClass[review.status] || 'bg-charcoal/10 text-charcoal'
                        }`}
                      >
                        {review.status}
                      </span>
                      {(review.verifiedPurchase || review.verified) ? (
                        <span className="inline-flex rounded-pill bg-success/15 px-3 py-1 text-xs text-success">
                          Verified Purchase
                        </span>
                      ) : null}
                    </div>

                    {review.title ? (
                      <p className="font-medium text-charcoal">{review.title}</p>
                    ) : null}
                    <p className="text-sm leading-relaxed text-charcoal/80">{review.comment}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-[280px] lg:justify-end">
                    {review.status !== 'approved' ? (
                      <Button
                        size="sm"
                        onClick={() => runAction(review._id, reviewService.approveReview, 'Review approved successfully.')}
                        disabled={busyId === review._id}
                      >
                        {busyId === review._id ? 'Working...' : 'Approve'}
                      </Button>
                    ) : null}
                    {review.status !== 'rejected' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runAction(review._id, reviewService.rejectReview, 'Review rejected successfully.')}
                        disabled={busyId === review._id}
                      >
                        Reject
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      className="bg-error text-milk hover:brightness-95"
                      onClick={() => onDelete(review._id)}
                      disabled={busyId === review._id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))
          : null}
      </section>
    </div>
  );
}
