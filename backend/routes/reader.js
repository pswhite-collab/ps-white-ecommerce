import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { readerDownloadLimit } from '../middleware/readerDownloadLimit.js';
import {
  getBookContent,
  getBookPreview,
  getReaderMetadata,
} from '../controllers/readingController.js';

const router = Router();

router.get('/:bookId/content', protect, readerDownloadLimit, getBookContent);
router.get('/:bookId/preview', getBookPreview);
router.get('/:bookId/metadata', protect, getReaderMetadata);

export default router;
