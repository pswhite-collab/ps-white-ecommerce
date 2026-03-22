import { Router } from 'express';
import passport from 'passport';
import { googleCallback, googleStart } from '../controllers/adminAuthController.js';

const router = Router();

router.get('/google', googleStart, passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/admin/auth/failed' }),
  googleCallback
);
router.get('/failed', (_req, res) => res.status(401).json({ message: 'Google OAuth failed' }));

export default router;
