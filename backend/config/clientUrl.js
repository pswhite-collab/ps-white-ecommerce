/**
 * Utilities for parsing and validating client URLs and CORS origins.
 */

export const sanitizeUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') {
    return '';
  }
  return urlString.trim().replace(/\/+$/, '');
};

export const getAllowedOrigins = (rawClientUrl = process.env.CLIENT_URL) => {
  const fallback = 'http://localhost:5173';
  const source = rawClientUrl || fallback;

  const origins = source
    .split(',')
    .map((item) => sanitizeUrl(item))
    .filter(Boolean);

  if (origins.length === 0) {
    return [fallback];
  }

  // Validate each origin is a valid URL
  return origins.map((origin) => {
    try {
      const parsed = new URL(origin);
      return parsed.origin;
    } catch {
      return origin;
    }
  });
};

export const getPrimaryClientUrl = (rawClientUrl = process.env.CLIENT_URL) => {
  const origins = getAllowedOrigins(rawClientUrl);
  const primary = origins[0];

  try {
    const parsed = new URL(primary);
    return parsed.origin;
  } catch (err) {
    throw new Error(`Invalid CLIENT_URL configuration: "${primary}" is not a valid URL. ${err.message}`);
  }
};

export const getClientUrlForOrigin = (requestedOrigin, rawClientUrl = process.env.CLIENT_URL) => {
  const allowed = getAllowedOrigins(rawClientUrl);
  if (requestedOrigin) {
    const sanitized = sanitizeUrl(requestedOrigin);
    const match = allowed.find((item) => item.toLowerCase() === sanitized.toLowerCase());
    if (match) {
      return match;
    }
  }
  return getPrimaryClientUrl(rawClientUrl);
};

export default {
  getAllowedOrigins,
  getPrimaryClientUrl,
  getClientUrlForOrigin,
  sanitizeUrl,
};
