import { Router } from 'express';
import auth from '../middleware/auth.js';
import { createReview, getBookReviews } from '../controllers/reviewController.js';

const router = Router();

router.get('/book/:bookId', getBookReviews);
router.post('/', auth, createReview);

export default router;
