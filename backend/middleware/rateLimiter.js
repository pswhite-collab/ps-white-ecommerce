import rateLimit from 'express-rate-limit';
import { getPrimaryClientUrl } from '../config/clientUrl.js';

const oauthRateLimitHandler = (req, res) => {
  const isAdmin = req.originalUrl?.includes('/admin');
  const loginPath = isAdmin ? '/admin/login' : '/login';

  const acceptsHtml = req.accepts('html');
  const isApiCall = req.xhr || req.headers['sec-fetch-dest'] === 'empty' || (!acceptsHtml && req.accepts('json'));

  if (isApiCall) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'rate_limited',
    });
  }

  try {
    const primaryClient = getPrimaryClientUrl();
    const target = new URL(loginPath, primaryClient);
    target.searchParams.set('error', 'rate_limited');
    return res.redirect(target.toString());
  } catch {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'rate_limited',
    });
  }
};

// Rate limiter for OAuth login initiation routes (relaxed to 20 requests per 15 min per IP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number.parseInt(process.env.AUTH_RATE_LIMIT || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: oauthRateLimitHandler,
});

// Limiter for OAuth callback routes (relaxed to 30 requests per 5 min per IP)
export const oauthCallbackLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: Number.parseInt(process.env.OAUTH_CALLBACK_RATE_LIMIT || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: oauthRateLimitHandler,
});

export default {
  authLimiter,
  oauthCallbackLimiter,
};
