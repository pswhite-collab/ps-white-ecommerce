import fs from 'fs';
import Book from '../models/Book.js';
import Review from '../models/Review.js';
import { bookMutationSchema } from '../utils/validation.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';

// Coerce string booleans that arrive via FormData (multipart)
const coerceBoolStr = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
};

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

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filters.$or = [{ title: regex }, { author: regex }, { description: regex }];
  }

  if (query.format && ['ebook', 'physical', 'audiobook'].includes(query.format)) {
    filters[`formats.${query.format}.available`] = true;
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

const toPlainObject = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value.toObject === 'function') {
    return value.toObject();
  }

  return { ...value };
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
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasNextPage: skip + books.length < total,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getBookById = async (req, res, next) => {
  try {
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
    let bodyData = { ...req.body };
    try {
      if (typeof bodyData.genres === 'string') bodyData.genres = JSON.parse(bodyData.genres);
      if (typeof bodyData.languages === 'string') bodyData.languages = JSON.parse(bodyData.languages);
      if (typeof bodyData.formats === 'string') bodyData.formats = JSON.parse(bodyData.formats);
    } catch(e) {}

    // Coerce booleans from FormData strings
    if (bodyData.featured !== undefined) bodyData.featured = coerceBoolStr(bodyData.featured);
    if (bodyData.active !== undefined) bodyData.active = coerceBoolStr(bodyData.active);

    const { error, value } = bookMutationSchema.validate(bodyData);
    if (error) {
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    if (req.files) {
      if (req.files.coverImage?.[0]) {
        const result = await uploadToCloudinary(req.files.coverImage[0].path, 'books/covers');
        if (result) value.coverImage = { url: result.url, publicId: result.publicId };
      }
      
      value.formats = value.formats || {};

      if (req.files.epubFile?.[0]) {
        const result = await uploadToCloudinary(req.files.epubFile[0].path, 'books/ebooks');
        if (result) {
          value.formats.ebook = value.formats.ebook || {};
          value.formats.ebook.available = true;
          value.formats.ebook.files = value.formats.ebook.files || {};
          value.formats.ebook.files.epub = result;
        }
      }

      if (req.files.pdfFile?.[0]) {
        const result = await uploadToCloudinary(req.files.pdfFile[0].path, 'books/ebooks');
        if (result) {
          value.formats.ebook = value.formats.ebook || {};
          value.formats.ebook.available = true;
          value.formats.ebook.files = value.formats.ebook.files || {};
          value.formats.ebook.files.pdf = result;
        }
      }

      if (req.files.audioFile?.[0]) {
        const result = await uploadToCloudinary(req.files.audioFile[0].path, 'books/audiobooks');
        if (result) {
          value.formats.audiobook = value.formats.audiobook || {};
          value.formats.audiobook.available = true;
          value.formats.audiobook.file = result;
        }
      }
    }

    const created = await Book.create(value);

    return res.status(201).json({
      success: true,
      data: {
        book: created,
      },
    });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    return next(error);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    let bodyData = { ...req.body };
    try {
      if (typeof bodyData.genres === 'string') bodyData.genres = JSON.parse(bodyData.genres);
      if (typeof bodyData.languages === 'string') bodyData.languages = JSON.parse(bodyData.languages);
      if (typeof bodyData.formats === 'string') bodyData.formats = JSON.parse(bodyData.formats);
    } catch(e) {}

    // Coerce booleans from FormData strings
    if (bodyData.featured !== undefined) bodyData.featured = coerceBoolStr(bodyData.featured);
    if (bodyData.active !== undefined) bodyData.active = coerceBoolStr(bodyData.active);

    const { error, value } = bookMutationSchema.validate(bodyData);
    if (error) {
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    if (req.files) {
      if (req.files.coverImage?.[0]) {
        const result = await uploadToCloudinary(req.files.coverImage[0].path, 'books/covers');
        if (result) value.coverImage = { url: result.url, publicId: result.publicId };
      }
      
      value.formats = value.formats || {};

      if (req.files.epubFile?.[0]) {
        const result = await uploadToCloudinary(req.files.epubFile[0].path, 'books/ebooks');
        if (result) {
          value.formats.ebook = value.formats.ebook || {};
          value.formats.ebook.available = true;
          value.formats.ebook.files = value.formats.ebook.files || {};
          value.formats.ebook.files.epub = result;
        }
      }

      if (req.files.pdfFile?.[0]) {
        const result = await uploadToCloudinary(req.files.pdfFile[0].path, 'books/ebooks');
        if (result) {
          value.formats.ebook = value.formats.ebook || {};
          value.formats.ebook.available = true;
          value.formats.ebook.files = value.formats.ebook.files || {};
          value.formats.ebook.files.pdf = result;
        }
      }

      if (req.files.audioFile?.[0]) {
        const result = await uploadToCloudinary(req.files.audioFile[0].path, 'books/audiobooks');
        if (result) {
          value.formats.audiobook = value.formats.audiobook || {};
          value.formats.audiobook.available = true;
          value.formats.audiobook.file = result;
        }
      }
    }

    // Merge nested updates for formats and files to not accidentally overwrite existing subfields like `price`
    // Find current book first 
    const currentBook = await Book.findById(req.params.id);
    if (!currentBook) {
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const currentFormats = toPlainObject(currentBook.formats);
    const incomingFormats = value.formats || {};

    const mergedFormats = {
      ...currentFormats,
      ...incomingFormats,
      ebook: {
        ...(currentFormats.ebook || {}),
        ...(incomingFormats.ebook || {}),
        files: {
          ...toPlainObject(currentFormats.ebook?.files),
          ...toPlainObject(incomingFormats.ebook?.files),
        },
      },
      physical: {
        ...(currentFormats.physical || {}),
        ...(incomingFormats.physical || {}),
        dimensions: {
          ...toPlainObject(currentFormats.physical?.dimensions),
          ...toPlainObject(incomingFormats.physical?.dimensions),
        },
      },
      audiobook: {
        ...(currentFormats.audiobook || {}),
        ...(incomingFormats.audiobook || {}),
        file: {
          ...toPlainObject(currentFormats.audiobook?.file),
          ...toPlainObject(incomingFormats.audiobook?.file),
        },
      },
    };

    Object.assign(currentBook, {
      ...value,
      coverImage: value.coverImage || currentBook.coverImage,
      formats: mergedFormats,
    });
    const updated = await currentBook.save();

    return res.json({
      success: true,
      data: {
        book: updated,
      },
    });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    return next(error);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const updated = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: { active: false } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    return res.json({
      success: true,
      data: {
        message: 'Book archived successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const searchBooks = async (req, res, next) => {
  try {
    const query = (req.query.q || req.query.search || '').trim();
    if (!query) {
      return res.json({ success: true, data: { books: [] } });
    }

    let books = [];
    try {
      books = await Book.find(
        { $text: { $search: query }, active: true },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);
    } catch (_error) {
      const regex = new RegExp(query, 'i');
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
