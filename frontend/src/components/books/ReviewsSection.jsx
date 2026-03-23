import { useEffect, useState } from 'react';
import reviewService from '../../services/reviewService';
import Button from '../common/Button';

export default function ReviewsSection({ bookId, refreshKey = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getBookReviews(bookId, { sort });
      setReviews(data.reviews);
    } catch (_error) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [bookId, sort, refreshKey]);

  const onHelpful = async (id) => {
    await reviewService.voteHelpful(id);
    await loadReviews();
  };

  if (loading) {
    return <div className="rounded-card bg-oat/40 p-4 text-sm text-charcoal/70">Loading reviews...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-3xl text-mocha">Reviews</h3>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-card border border-taupe/50 bg-milk px-3 py-2 text-sm"
        >
          <option value="helpful">Most Helpful</option>
          <option value="newest">Newest</option>
          <option value="highest">Highest Rating</option>
        </select>
      </div>

      {!reviews.length ? (
        <div className="rounded-card border border-taupe/30 bg-milk p-4 text-sm text-charcoal/70">
          No approved reviews yet.
        </div>
      ) : (
        reviews.map((review) => (
          <article key={review._id} className="rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-mocha">{review.title || 'Untitled Review'}</h4>
              <span className="text-sm text-charcoal/70">{review.rating}/5</span>
            </div>
            <p className="mt-2 text-sm text-charcoal/75">{review.comment}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-charcoal/60">
              <span>
                {review.user?.firstName || 'Reader'} {review.user?.lastName || ''}
                {(review.verifiedPurchase || review.verified) ? ' - Verified Purchase' : ''}
              </span>
              <Button size="sm" variant="outline" onClick={() => onHelpful(review._id)}>
                Helpful ({review.helpfulVotes || 0})
              </Button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
