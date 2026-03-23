import { Router } from 'express';
import {
  createQuote,
  deleteQuote,
  getAllQuotes,
  getQuoteStats,
  getTodaysQuote,
  updateQuote,
} from '../controllers/quoteController.js';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';

const router = Router();

router.get('/today', getTodaysQuote);

router.get('/stats', protect, adminProtect, getQuoteStats);
router.get('/', protect, adminProtect, getAllQuotes);
router.post('/', protect, adminProtect, createQuote);
router.put('/:id', protect, adminProtect, updateQuote);
router.delete('/:id', protect, adminProtect, deleteQuote);

export default router;
