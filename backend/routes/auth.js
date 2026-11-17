import { Router } from 'express';
import passport from 'passport';
import { protect } from '../middleware/auth.js';
import { authLimiter, oauthCallbackLimiter } from '../middleware/rateLimiter.js';
import generateToken from '../utils/generateToken.js';
import { getPrimaryClientUrl } from '../config/clientUrl.js';
import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  register,
  resetPassword,
  updateCurrentUser,
  verifyEmail,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get(
  '/google',
  authLimiter,
  (req, res, next) => {
    if (!passport._strategies || !passport._strategies['google-customer']) {
      const primaryClient = getPrimaryClientUrl();
      const redirectUrl = new URL('/login', primaryClient);
      redirectUrl.searchParams.set('error', 'oauth_not_configured');
      return res.redirect(redirectUrl.toString());
    }

    return passport.authenticate('google-customer', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      session: false,
    })(req, res, next);
  }
);
router.get(
  '/google/callback',
  oauthCallbackLimiter,
  (req, res, next) => {
    passport.authenticate('google-customer', { session: false }, (err, user) => {
      const primaryClient = getPrimaryClientUrl();

      if (err || !user) {
        const rawCode = err?.message?.toLowerCase() || '';
        let errorCode = 'oauth_failed';

        if (rawCode.includes('registration_closed') || rawCode.includes('registration is currently disabled')) {
          errorCode = 'registration_closed';
        } else if (rawCode.includes('account_disabled')) {
          errorCode = 'account_disabled';
        } else if (rawCode.includes('access_denied')) {
          errorCode = 'access_denied';
        }

        const redirectUrl = new URL('/login', primaryClient);
        redirectUrl.searchParams.set('error', errorCode);
        return res.redirect(redirectUrl.toString());
      }

      const token = generateToken(user._id, { role: user.role });
      // Defect H: Send token in fragment to prevent leaking into server logs / browser history
      return res.redirect(`${primaryClient}/auth/google/success#token=${encodeURIComponent(token)}`);
    })(req, res, next);
  }
);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateCurrentUser);

export default router;
