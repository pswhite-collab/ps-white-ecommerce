import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  return res.json({
    success: true,
    data: {
      message: 'Client-side cart is enabled for MVP. Server-side cart can be added later.',
    },
  });
});

export default router;
