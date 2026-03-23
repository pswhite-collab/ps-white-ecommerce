import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import {
  getAllSubscribers,
  addSubscriber,
  deleteSubscriber,
  getStats,
  getSubscribers,
  unsubscribe,
} from '../controllers/newsletterController.js';

const router = Router();

router.post('/subscribe', addSubscriber);
router.post('/unsubscribe', unsubscribe);
router.get('/subscribers', protect, adminProtect, getSubscribers);
router.get('/', protect, adminProtect, getAllSubscribers);
router.get('/stats', protect, adminProtect, getStats);
router.delete('/:id', protect, adminProtect, deleteSubscriber);

export default router;
