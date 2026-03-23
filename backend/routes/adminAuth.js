import { Router } from 'express';
import passport from 'passport';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import { authLimiter, oauthCallbackLimiter } from '../middleware/rateLimiter.js';
import {
  getAdminMe,
  googleAuth,
  googleCallback,
  logoutAdmin,
  verifyAdmin,
} from '../controllers/adminAuthController.js';

const router = Router();

router.get(
  '/google',
  authLimiter,
  googleAuth,
  passport.authenticate('google-admin', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);
router.get(
  '/google/callback',
  oauthCallbackLimiter,
  passport.authenticate('google-admin', {
    session: false,
    failureRedirect: '/api/admin/auth/failed',
  }),
  googleCallback
);

router.post('/verify-admin', verifyAdmin);
router.get('/me', protect, adminProtect, getAdminMe);
router.post('/logout', protect, adminProtect, logoutAdmin);
router.get('/failed', (_req, res) => res.status(401).json({ success: false, error: 'Google OAuth failed' }));

export default router;
