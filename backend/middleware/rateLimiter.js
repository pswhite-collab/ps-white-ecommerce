import rateLimit from 'express-rate-limit';

const jsonErrorHandler = (message) => (_req, res) =>
  res.status(429).json({
    success: false,
    message,
  });

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: jsonErrorHandler(message),
  });

// Rate limiter for OAuth login initiation routes
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

// Stricter limiter for OAuth callback routes
export const oauthCallbackLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  message: 'Too many authentication attempts. Please wait 5 minutes.',
});

export const passwordAuthLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

export const forgotPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: 'Too many password reset attempts. Please try again in 15 minutes.',
});

export default {
  authLimiter,
  forgotPasswordLimiter,
  oauthCallbackLimiter,
  passwordAuthLimiter,
};
