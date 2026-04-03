import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import ReadingProgress from '../models/ReadingProgress.js';
import User from '../models/User.js';
import { serializeEntitiesWithBookForClient } from '../utils/serializeBookForClient.js';
import { bookmarkSchema, progressUpdateSchema, readingSettingsSchema } from '../utils/validation.js';
import { generateSecureDownloadUrl } from '../utils/generateSignedUrl.js';

const ORDER_OWNERSHIP_STATUSES = ['processing', 'shipped', 'delivered', 'completed'];
const configuredPreviewLimit = Number.parseInt(process.env.READER_PREVIEW_CHAR_LIMIT || '2400', 10);
const PREVIEW_CHAR_LIMIT = Number.isNaN(configuredPreviewLimit)
  ? 2400
  : Math.max(600, configuredPreviewLimit);

const hasBookInOrder = (order, bookId) => {
  const normalizedBookId = String(bookId);
  return order.items.some((item) => String(item.book) === normalizedBookId);
};

const userOwnsBook = async (userId, bookId) => {
  const order = await Order.findOne({
    user: userId,
    status: { $in: ORDER_OWNERSHIP_STATUSES },
    'items.book': bookId,
  });

  return Boolean(order);
};

const toProgressPayload = (progress) => ({
  id: progress._id,
  user: progress.user,
  book: progress.book,
  currentPage: progress.currentPage,
  totalPages: progress.totalPages,
  progressPercentage: progress.progressPercentage,
  lastReadAt: progress.lastReadAt,
  startedAt: progress.startedAt,
  completedAt: progress.completedAt,
  totalReadingTime: progress.totalReadingTime,
  bookmarks: progress.bookmarks,
  settings: progress.settings,
  updatedAt: progress.updatedAt,
});

const normalizePreviewText = (value = '') =>
  String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const splitIntoChapterSections = (text) => {
  const chapterRegex =
    /(chapter\s+\d+[^\n]*)\n([\s\S]*?)(?=\n\s*chapter\s+\d+[^\n]*\n|$)/gi;
  const chapters = [];
  let match = chapterRegex.exec(text);

  while (match) {
    chapters.push({
      title: match[1].trim(),
      content: match[2].trim(),
    });
    match = chapterRegex.exec(text);
  }

  return chapters;
};

const toWordCount = (text = '') => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
};

const buildPreviewPayload = (book) => {
  const sourceText = normalizePreviewText(book.excerpt || book.description || '');
  const chapters = splitIntoChapterSections(sourceText);

  let title = 'Chapter 1 Preview';
  let content = sourceText;
  let chapterCountDetected = chapters.length;

  if (chapters.length > 0) {
    title = chapters[0].title || title;
    content = chapters[0].content || '';
  }

  if (!content) {
    content = sourceText;
  }

  const truncated = content.length > PREVIEW_CHAR_LIMIT;
  const truncatedContent = truncated ? `${content.slice(0, PREVIEW_CHAR_LIMIT).trim()}...` : content;
  const wordCount = toWordCount(truncatedContent);

  return {
    preview: truncatedContent,
    previewDetails: {
      title,
      content: truncatedContent,
      truncated,
      chapterCountDetected,
      wordCount,
      estimatedReadMinutes: Math.max(1, Math.round(wordCount / 180)),
      source: book.excerpt ? 'excerpt' : 'description',
    },
  };
};

const resolveReaderAssetUrl = async (file, expiresIn, format) => {
  if (!file) {
    return null;
  }

  const storedUrl = String(file.url || '').trim();
  const usesPrivateDelivery = /\/private\//.test(storedUrl);
  const usesAuthenticatedDelivery = /\/authenticated\//.test(storedUrl);

  if (file.publicId) {
    const deliveryType = usesPrivateDelivery
      ? 'private'
      : usesAuthenticatedDelivery
        ? 'authenticated'
        : 'upload';

    return generateSecureDownloadUrl(file.publicId, {
      type: deliveryType,
      expiresIn,
      format: file.publicId.endsWith(`.${format}`) ? null : format,
    });
  }

  if (storedUrl) {
      return storedUrl;
  }

  return null;
};

export const getLibrary = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      status: { $in: ORDER_OWNERSHIP_STATUSES },
    }).populate('items.book');

    const bookMap = new Map();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.book && item.book.active !== false) {
          bookMap.set(String(item.book._id), item.book);
        }
      });
    });

    const bookIds = [...bookMap.keys()].map((id) => new mongoose.Types.ObjectId(id));
    const progressRows = await ReadingProgress.find({
      user: req.user._id,
      book: { $in: bookIds },
    });

    const progressMap = new Map(progressRows.map((row) => [String(row.book), row]));

    const items = [...bookMap.entries()].map(([bookId, book]) => ({
      book,
      progress: progressMap.get(bookId) || null,
    }));
    const serializedItems = await serializeEntitiesWithBookForClient(items);

    return res.json({ success: true, data: { library: serializedItems } });
  } catch (error) {
    return next(error);
  }
};

export const getProgress = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    let progress = await ReadingProgress.findOne({ user: req.user._id, book: bookId });

    if (!progress) {
      const book = await Book.findById(bookId).select('formats.ebook.pageCount');
      if (!book) {
        return res.status(404).json({ success: false, error: 'Book not found' });
      }

      progress = await ReadingProgress.create({
        user: req.user._id,
        book: bookId,
        currentPage: 0,
        totalPages: book.formats?.ebook?.pageCount || 0,
      });
    }

    return res.json({ success: true, data: { progress: toProgressPayload(progress) } });
  } catch (error) {
    return next(error);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const { error, value } = progressUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const { bookId } = req.params;

    const progress = await ReadingProgress.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      {
        $set: {
          currentPage: value.currentPage,
          totalPages: value.totalPages,
          lastReadAt: new Date(),
        },
        $inc: {
          totalReadingTime: value.readingMinutes || 0,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({ success: true, data: { progress: toProgressPayload(progress) } });
  } catch (error) {
    return next(error);
  }
};

export const addBookmark = async (req, res, next) => {
  try {
    const { error, value } = bookmarkSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const { bookId } = req.params;

    const progress = await ReadingProgress.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      {
        $push: { bookmarks: { page: value.page, note: value.note } },
        $setOnInsert: { currentPage: value.page, startedAt: new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: { progress: toProgressPayload(progress) } });
  } catch (error) {
    return next(error);
  }
};

export const deleteBookmark = async (req, res, next) => {
  try {
    const { bookId, bookmarkId } = req.params;

    const progress = await ReadingProgress.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { $pull: { bookmarks: { _id: bookmarkId } } },
      { new: true }
    );

    if (!progress) {
      return res.status(404).json({ success: false, error: 'Reading progress not found' });
    }

    return res.json({ success: true, data: { progress: toProgressPayload(progress) } });
  } catch (error) {
    return next(error);
  }
};

export const updateReaderSettings = async (req, res, next) => {
  try {
    const { error, value } = readingSettingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const { bookId } = req.params;

    const progress = await ReadingProgress.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      {
        $set: {
          settings: value,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: { settings: progress.settings } });
  } catch (error) {
    return next(error);
  }
};

export const markCompleted = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const totalPages = book.formats?.ebook?.pageCount || 0;

    const progress = await ReadingProgress.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      {
        $set: {
          completedAt: new Date(),
          currentPage: totalPages,
          totalPages,
          progressPercentage: 100,
          lastReadAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.totalBooksRead': 1,
      },
    });

    return res.json({
      success: true,
      data: {
        message: 'Book marked as completed',
        progress: toProgressPayload(progress),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getReadingStats = async (req, res, next) => {
  try {
    const [user, progressRows] = await Promise.all([
      User.findById(req.user._id),
      ReadingProgress.find({ user: req.user._id }),
    ]);

    const aggregate = progressRows.reduce(
      (acc, row) => {
        acc.totalReadingTime += row.totalReadingTime || 0;
        acc.totalPagesRead += row.currentPage || 0;
        if (row.completedAt || row.progressPercentage >= 100) {
          acc.booksCompleted += 1;
        }
        if (!row.completedAt && row.progressPercentage > 0) {
          acc.currentlyReading += 1;
        }
        return acc;
      },
      { totalReadingTime: 0, totalPagesRead: 0, booksCompleted: 0, currentlyReading: 0 }
    );

    return res.json({
      success: true,
      data: {
        stats: {
          ...user.stats,
          totalReadingTime: aggregate.totalReadingTime,
          totalPagesRead: aggregate.totalPagesRead,
          booksCompleted: aggregate.booksCompleted,
          currentlyReading: aggregate.currentlyReading,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getCurrentlyReading = async (req, res, next) => {
  try {
    const progress = await ReadingProgress.find({
      user: req.user._id,
      progressPercentage: { $gt: 0, $lt: 100 },
    })
      .populate('book')
      .sort({ lastReadAt: -1 });
    const serializedProgress = await serializeEntitiesWithBookForClient(progress);

    return res.json({ success: true, data: { items: serializedProgress } });
  } catch (error) {
    return next(error);
  }
};

export const getBookContent = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const configuredDownloadLimit = Number.parseInt(
      process.env.READER_DAILY_DOWNLOAD_LIMIT || '5',
      10
    );
    const downloadLimitPerDay = Number.isNaN(configuredDownloadLimit)
      ? 5
      : Math.max(1, configuredDownloadLimit);
    const configuredSignedUrlTtl = Number.parseInt(
      process.env.READER_SIGNED_URL_EXPIRES_IN || '3600',
      10
    );
    const expiresIn = Number.isNaN(configuredSignedUrlTtl)
      ? 3600
      : Math.max(60, configuredSignedUrlTtl);

    const ownsBook = await userOwnsBook(req.user._id, bookId);
    if (!ownsBook) {
      return res.status(403).json({ success: false, error: 'You need to purchase this book first' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const epubFile = book.formats?.ebook?.files?.epub;
    const pdfFile = book.formats?.ebook?.files?.pdf;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return res.json({
      success: true,
      data: {
        epubUrl: await resolveReaderAssetUrl(epubFile, expiresIn, 'epub'),
        pdfUrl: await resolveReaderAssetUrl(pdfFile, expiresIn, 'pdf'),
        expiresAt,
        security: {
          watermarkText: req.user?.email
            ? `Licensed to ${req.user.email}`
            : 'Licensed content',
          downloadLimitPerDay,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getBookPreview = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId).select('title author excerpt description');
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const payload = buildPreviewPayload(book);

    return res.json({
      success: true,
      data: {
        title: book.title,
        author: book.author,
        preview: payload.preview,
        previewDetails: payload.previewDetails,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getReaderMetadata = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    const ownsBook = await userOwnsBook(req.user._id, bookId);
    if (!ownsBook) {
      return res.status(403).json({ success: false, error: 'Purchase required for metadata access' });
    }

    const book = await Book.findById(bookId).select('title author formats.ebook.pageCount');
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    return res.json({
      success: true,
      data: {
        title: book.title,
        author: book.author,
        pageCount: book.formats?.ebook?.pageCount || 0,
        chapterCount: 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const hasPurchasedBook = userOwnsBook;
export const hasBookInOrderItem = hasBookInOrder;
