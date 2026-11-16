import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Quote text is required'],
      trim: true,
      maxlength: [500, 'Quote cannot exceed 500 characters'],
    },
    author: {
      type: String,
      trim: true,
      default: 'PS White',
    },
    category: {
      type: String,
      enum: ['inspiration', 'motivation', 'life', 'writing', 'reading', 'general'],
      default: 'general',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

quoteSchema.index({ startDate: 1, endDate: 1, active: 1 });

quoteSchema.methods.isActiveNow = function isActiveNow() {
  const now = new Date();
  return Boolean(this.active && now >= this.startDate && now <= this.endDate);
};

quoteSchema.statics.getTodaysQuote = async function getTodaysQuote() {
  const now = new Date();
  return this.findOne({
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ startDate: -1 });
};

const Quote = mongoose.model('Quote', quoteSchema);

export default Quote;
