import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  capturePayPalOrder,
  confirmStripePayment,
  createPayPalOrder,
  createRazorpayOrder,
  createStripeIntent,
  stripeWebhook,
  verifyRazorpayPayment,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/confirm', protect, confirmStripePayment);
router.post('/stripe/webhook', stripeWebhook);
router.post('/paypal/create-order', protect, createPayPalOrder);
router.post('/paypal/capture', protect, capturePayPalOrder);

export default router;
