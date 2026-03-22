import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  return res.status(501).json({ message: 'Cart routes will be implemented on Day 2' });
});

export default router;
