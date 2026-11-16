import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { readerDownloadLimit } from '../middleware/readerDownloadLimit.js';
import {
  downloadBookFile,
  getBookContent,
  getBookPreview,
  getReaderMetadata,
  getSampleFile,
} from '../controllers/readingController.js';

const router = Router();

router.get('/sample/:format', getSampleFile);
router.get('/:bookId/content', protect, readerDownloadLimit, getBookContent);
router.get('/:bookId/preview', getBookPreview);
router.get('/:bookId/metadata', protect, getReaderMetadata);
router.get('/:bookId/download/:format', protect, readerDownloadLimit, downloadBookFile);

export default router;
