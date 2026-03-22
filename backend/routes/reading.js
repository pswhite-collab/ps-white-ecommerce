import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  addBookmark,
  getReadingProgress,
  updateReadingProgress,
} from '../controllers/readingController.js';

const router = Router();

router.get('/:bookId', auth, getReadingProgress);
router.patch('/:bookId', auth, updateReadingProgress);
router.post('/:bookId/bookmarks', auth, addBookmark);

export default router;
