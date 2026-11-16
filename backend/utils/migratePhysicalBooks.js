import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Book from '../models/Book.js';

const defaultPhysicalFormat = {
  available: false,
  price: 0,
  stock: 0,
  weight: 0,
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
  },
  isbn: '',
  publisher: '',
  publicationDate: null,
  binding: 'Paperback',
  pages: 0,
  language: 'English',
};

const migratePhysicalBooks = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.error('Cannot run migration without a database connection.');
      process.exit(1);
    }

    const result = await Book.updateMany(
      { 'formats.physical': { $exists: false } },
      { $set: { 'formats.physical': defaultPhysicalFormat } }
    );

    console.log(`Migration complete. Updated ${result.modifiedCount} books.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

migratePhysicalBooks();
