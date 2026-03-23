import { Router } from 'express';
import passport from 'passport';
import { protect } from '../middleware/auth.js';
import { authLimiter, oauthCallbackLimiter } from '../middleware/rateLimiter.js';
import generateToken from '../utils/generateToken.js';
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
  passport.authenticate('google-customer', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
  })
);
router.get(
  '/google/callback',
  oauthCallbackLimiter,
  passport.authenticate('google-customer', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id, { role: req.user.role });
    const redirectUrl = new URL(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/success`
    );
    redirectUrl.searchParams.set('token', token);
    res.redirect(redirectUrl.toString());
  }
);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateCurrentUser);

export default router;
