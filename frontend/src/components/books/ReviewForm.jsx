import { useState } from 'react';
import Button from '../common/Button';
import reviewService from '../../services/reviewService';

export default function ReviewForm({ bookId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus('');

    try {
      await reviewService.createReview({ bookId, rating, title, comment });
      setStatus('Review submitted successfully.');
      setTitle('');
      setComment('');
      onSubmitted?.();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-taupe/30 bg-oat/40 p-4">
      <h4 className="font-display text-2xl text-mocha">Write a Review</h4>
      <div className="mt-3 grid gap-3">
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="rounded-card border border-taupe/50 bg-milk px-3 py-2"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} Stars</option>
          ))}
        </select>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Review title"
          className="rounded-card border border-taupe/50 bg-milk px-3 py-2"
        />
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Write your review"
          rows={4}
          required
          className="rounded-card border border-taupe/50 bg-milk px-3 py-2"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
        {status ? <p className="text-sm text-charcoal/70">{status}</p> : null}
      </div>
    </form>
  );
}
