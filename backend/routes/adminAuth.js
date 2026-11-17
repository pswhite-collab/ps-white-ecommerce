import { Router } from 'express';
import passport from 'passport';
import { protect } from '../middleware/auth.js';
import adminProtect from '../middleware/adminAuth.js';
import { authLimiter, oauthCallbackLimiter } from '../middleware/rateLimiter.js';
import generateToken from '../utils/generateToken.js';
import { getPrimaryClientUrl } from '../config/clientUrl.js';
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
  (req, res, next) => {
    if (!passport._strategies || !passport._strategies['google-admin']) {
      const primaryClient = getPrimaryClientUrl();
      const redirectUrl = new URL('/admin/login', primaryClient);
      redirectUrl.searchParams.set('error', 'oauth_not_configured');
      return res.redirect(redirectUrl.toString());
    }

    return passport.authenticate('google-admin', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  oauthCallbackLimiter,
  (req, res, next) => {
    passport.authenticate('google-admin', { session: false }, (err, user) => {
      const primaryClient = getPrimaryClientUrl();

      if (err || !user) {
        const rawCode = err?.message?.toLowerCase() || '';
        let errorCode = 'access_denied';

        if (rawCode.includes('account_disabled')) {
          errorCode = 'account_disabled';
        } else if (rawCode.includes('access_denied') || rawCode.includes('access denied')) {
          errorCode = 'access_denied';
        } else {
          errorCode = 'oauth_failed';
        }

        const redirectUrl = new URL('/admin/login', primaryClient);
        redirectUrl.searchParams.set('error', errorCode);
        return res.redirect(redirectUrl.toString());
      }

      const token = generateToken(user._id, { role: user.role });
      // Defect H: Send token in fragment to avoid leaking in history / server logs
      return res.redirect(`${primaryClient}/admin/login#token=${encodeURIComponent(token)}`);
    })(req, res, next);
  }
);

router.post('/verify-admin', verifyAdmin);
router.get('/me', protect, adminProtect, getAdminMe);
router.post('/logout', protect, adminProtect, logoutAdmin);
router.get('/failed', (_req, res) => {
  const primaryClient = getPrimaryClientUrl();
  const redirectUrl = new URL('/admin/login', primaryClient);
  redirectUrl.searchParams.set('error', 'access_denied');
  return res.redirect(redirectUrl.toString());
});

export default router;
