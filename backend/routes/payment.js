import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  confirmStripePayment,
  createStripeIntent,
  stripeWebhook,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/confirm', protect, confirmStripePayment);
router.post('/stripe/webhook', stripeWebhook);

export default router;
