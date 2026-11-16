import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Review from '../models/Review.js';
import { bookMutationSchema } from '../utils/validation.js';

const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilters = (query) => {
  const filters = { active: true };

  // Main catalog should include both featured and non-featured books.
  // Only apply featured filtering when explicitly requested.
  if (query.featured === 'true') {
    filters.featured = true;
  }

  if (query.genre) {
    filters.genres = query.genre;
  }

  const conditions = [];

  if (query.search) {
    const escaped = escapeRegex(query.search.trim());
    if (escaped) {
      const regex = new RegExp(escaped, 'i');
      conditions.push({ $or: [{ title: regex }, { author: regex }, { description: regex }] });
    }
  }

  if (query.format && ['ebook', 'physical', 'audiobook'].includes(query.format)) {
    filters[`formats.${query.format}.available`] = true;
  }

  if (query.maxPrice) {
    const max = Number(query.maxPrice);
    if (!Number.isNaN(max) && max > 0) {
      conditions.push({
        $or: [
          { 'formats.ebook.price': { $lte: max } },
          { 'formats.physical.price': { $lte: max } },
          { 'formats.audiobook.price': { $lte: max } },
        ],
      });
    }
  }

  if (conditions.length === 1) {
    Object.assign(filters, conditions[0]);
  } else if (conditions.length > 1) {
    filters.$and = conditions;
  }

  return filters;
};

const resolveSort = (sort) => {
  if (sort === 'price') {
    return { 'formats.ebook.price': 1 };
  }
  if (sort === '-price') {
    return { 'formats.ebook.price': -1 };
  }
  if (sort === 'title') {
    return { title: 1 };
  }
  if (sort === '-rating') {
    return { averageRating: -1 };
  }
  return { createdAt: -1 };
};

export const getAllBooks = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);
    const sort = resolveSort(req.query.sort);

    const [books, total] = await Promise.all([
      Book.find(filters).sort(sort).skip(skip).limit(limit),
      Book.countDocuments(filters),
    ]);

    return res.json({
      success: true,
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getBookById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const book = await Book.findById(req.params.id);
    if (!book || !book.active) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const reviews = await Review.find({
      book: book._id,
      status: 'approved',
    })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        book: {
          ...book.toObject(),
          reviews,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createBook = async (req, res, next) => {
  try {
    const { error, value } = bookMutationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const book = await Book.create(value);
    return res.status(201).json({ success: true, data: { book } });
  } catch (error) {
    return next(error);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const { error, value } = bookMutationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const book = await Book.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    return res.json({ success: true, data: { book } });
  } catch (error) {
    return next(error);
  }
};

export const archiveBook = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    return res.json({
      success: true,
      message: 'Book archived successfully',
      data: { book },
    });
  } catch (error) {
    return next(error);
  }
};

export const getGenres = async (_req, res, next) => {
  try {
    const genres = await Book.distinct('genres', { active: true });
    return res.json({ success: true, data: { genres } });
  } catch (error) {
    return next(error);
  }
};

export const searchBooks = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json({ success: true, data: { books: [] } });
    }

    const escaped = escapeRegex(query);
    const regex = new RegExp(escaped, 'i');
    let books = [];
    try {
      books = await Book.find(
        { $text: { $search: query }, active: true },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);
    } catch (_error) {
      books = await Book.find({
        active: true,
        $or: [{ title: regex }, { author: regex }, { description: regex }],
      }).limit(20);
    }

    return res.json({ success: true, data: { books } });
  } catch (error) {
    return next(error);
  }
};

export const getFeaturedBooks = async (_req, res, next) => {
  try {
    const books = await Book.find({ active: true, featured: true })
      .sort({ createdAt: -1 })
      .limit(8);

    return res.json({ success: true, data: { books } });
  } catch (error) {
    return next(error);
  }
};

export default {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  archiveBook,
  getGenres,
  searchBooks,
  getFeaturedBooks,
};
