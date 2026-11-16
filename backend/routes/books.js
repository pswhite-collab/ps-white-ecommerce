import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import { uploadAudio, uploadCover, uploadEbook } from '../middleware/upload.js';
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  getFeaturedBooks,
  searchBooks,
  updateBook,
} from '../controllers/bookController.js';
import {
  deleteFile,
  uploadAudiobook,
  uploadBookCover,
  uploadEbookFile,
} from '../controllers/uploadController.js';

const router = Router();

router.get('/featured', getFeaturedBooks);
router.get('/search', searchBooks);
router.get('/', getAllBooks);
router.get('/:id', getBookById);

router.post('/', protect, adminProtect, createBook);
router.put('/:id', protect, adminProtect, updateBook);
router.delete('/:id', protect, adminProtect, deleteBook);

router.post('/:id/upload-cover', protect, adminProtect, uploadCover, uploadBookCover);
router.post('/:id/upload-ebook', protect, adminProtect, uploadEbook, uploadEbookFile);
router.post('/:id/upload-audio', protect, adminProtect, uploadAudio, uploadAudiobook);
router.delete('/:id/files/:fileType', protect, adminProtect, deleteFile);

export default router;
