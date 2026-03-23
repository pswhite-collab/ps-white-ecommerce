import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  addBookmark,
  deleteBookmark,
  getCurrentlyReading,
  getLibrary,
  getProgress,
  getReadingStats,
  markCompleted,
  updateProgress,
  updateReaderSettings,
} from '../controllers/readingController.js';

const router = Router();

router.get('/library', protect, getLibrary);
router.get('/stats', protect, getReadingStats);
router.get('/currently-reading', protect, getCurrentlyReading);
router.get('/progress/:bookId', protect, getProgress);
router.post('/progress/:bookId', protect, getProgress);
router.put('/progress/:bookId/page', protect, updateProgress);
router.post('/progress/:bookId/bookmark', protect, addBookmark);
router.delete('/progress/:bookId/bookmark/:bookmarkId', protect, deleteBookmark);
router.put('/progress/:bookId/settings', protect, updateReaderSettings);
router.post('/progress/:bookId/complete', protect, markCompleted);

export default router;
