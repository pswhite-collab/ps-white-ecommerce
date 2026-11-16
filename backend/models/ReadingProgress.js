import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    page: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  }
);

const readingProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ['ebook'],
      default: 'ebook',
    },
    currentPage: { type: Number, default: 0, min: 0 },
    totalPages: { type: Number, default: 0, min: 0 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastReadAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    totalReadingTime: { type: Number, default: 0, min: 0 },
    bookmarks: [bookmarkSchema],
    settings: {
      fontSize: { type: Number, default: 100 },
      fontFamily: { type: String, default: 'serif' },
      theme: { type: String, default: 'light' },
      lineSpacing: { type: Number, default: 1.5 },
    },
  },
  {
    timestamps: true,
  }
);

readingProgressSchema.pre('save', function computeProgress(next) {
  if (this.totalPages > 0) {
    this.progressPercentage = Math.min(100, Math.round((this.currentPage / this.totalPages) * 100));
  }

  if (this.progressPercentage >= 100 && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

readingProgressSchema.index({ user: 1, book: 1 }, { unique: true });
readingProgressSchema.index({ user: 1, lastReadAt: -1 });

const ReadingProgress = mongoose.model('ReadingProgress', readingProgressSchema);

export default ReadingProgress;
