import rateLimit from 'express-rate-limit';

const jsonErrorHandler = (message) => (_req, res) =>
  res.status(429).json({
    success: false,
    message,
  });

// Rate limiter for OAuth login initiation routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: jsonErrorHandler('Too many login attempts. Please try again in 15 minutes.'),
});

// Stricter limiter for OAuth callback routes
export const oauthCallbackLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: jsonErrorHandler('Too many authentication attempts. Please wait 5 minutes.'),
});

export default {
  authLimiter,
  oauthCallbackLimiter,
};
