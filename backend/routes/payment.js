import { Router } from 'express';

const router = Router();

router.post('/razorpay/create-order', (_req, res) => {
  return res.status(501).json({ message: 'Razorpay integration placeholder for Day 3' });
});

router.post('/stripe/create-intent', (_req, res) => {
  return res.status(501).json({ message: 'Stripe integration placeholder for Day 3' });
});

export default router;
