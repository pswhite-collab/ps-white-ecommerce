import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  confirmStripePayment,
  createStripeCheckoutSession,
  createRazorpayOrder,
  createStripeIntent,
  stripeWebhook,
  verifyRazorpayPayment,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/stripe/create-session', protect, createStripeCheckoutSession);
router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/confirm', protect, confirmStripePayment);
router.post('/stripe/webhook', stripeWebhook);

export default router;
