import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import {
  approveReview,
  createReview,
  deleteReview,
  getAllReviewsAdmin,
  getBookReviews,
  getFeaturedReviews,
  rejectReview,
  updateReview,
  voteHelpful,
} from '../controllers/reviewController.js';

const router = Router();

router.get('/featured', getFeaturedReviews);
router.get('/book/:bookId', getBookReviews);
router.get('/admin', protect, adminProtect, getAllReviewsAdmin);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/approve', protect, adminProtect, approveReview);
router.put('/:id/reject', protect, adminProtect, rejectReview);
router.post('/:id/helpful', protect, voteHelpful);

export default router;
