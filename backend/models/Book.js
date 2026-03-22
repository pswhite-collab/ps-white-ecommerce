import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    size: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const coverImageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
  },
  { _id: false }
);

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    subtitle: { type: String, trim: true },
    author: { type: String, trim: true, default: 'PS White' },
    description: { type: String, trim: true },
    excerpt: { type: String, trim: true },
    coverImage: coverImageSchema,
    genres: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    formats: {
      ebook: {
        available: { type: Boolean, default: false },
        price: { type: Number, default: 0, min: 0 },
        files: {
          epub: fileSchema,
          pdf: fileSchema,
        },
        pageCount: { type: Number, default: 0, min: 0 },
      },
      physical: {
        available: { type: Boolean, default: false },
        price: { type: Number, default: 0, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        weight: { type: Number, default: 0, min: 0 },
        dimensions: {
          length: { type: Number, default: 0, min: 0 },
          width: { type: Number, default: 0, min: 0 },
          height: { type: Number, default: 0, min: 0 },
        },
      },
      audiobook: {
        available: { type: Boolean, default: false },
        price: { type: Number, default: 0, min: 0 },
        file: fileSchema,
      },
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0, min: 0 },
    readingStats: {
      totalReaders: { type: Number, default: 0 },
      currentlyReading: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      averageProgress: { type: Number, default: 0, min: 0, max: 100 },
    },
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ title: 'text', author: 'text', description: 'text' });

const Book = mongoose.model('Book', bookSchema);

export default Book;
