import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, trim: true, maxlength: 1500, required: true },
    verified: { type: Boolean, default: false },
    verifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    helpful: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ user: 1, book: 1 }, { unique: true });
reviewSchema.index({ book: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
