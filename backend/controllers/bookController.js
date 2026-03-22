import Book from '../models/Book.js';

export const getBooks = async (_req, res, next) => {
  try {
    const books = await Book.find({ active: true }).sort({ createdAt: -1 });
    return res.json({ books });
  } catch (error) {
    return next(error);
  }
};

export const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.json({ book });
  } catch (error) {
    return next(error);
  }
};

export const searchBooks = async (req, res, next) => {
  try {
    const query = req.query.q?.trim();
    if (!query) {
      return res.json({ books: [] });
    }

    const books = await Book.find(
      { $text: { $search: query }, active: true },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    return res.json({ books });
  } catch (error) {
    return next(error);
  }
};
