/**
 * Resolves API base URL and auth endpoints safely without fragile string manipulation.
 */

export const getApiBaseUrl = (
  envApiUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined,
  isProd = typeof import.meta !== 'undefined' ? import.meta.env?.PROD : false
) => {
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim()) {
    return envApiUrl.trim().replace(/\/+$/, '');
  }

  if (isProd) {
    const errorMsg =
      'Configuration Error: VITE_API_URL is missing in production environment. API requests may fail.';
    console.error(`[PS White Config] ${errorMsg}`);
    // In production without VITE_API_URL, use relative /api path
    return '/api';
  }

  return 'http://localhost:5000/api';
};

export const getApiOrigin = (
  apiBase,
  baseWindowOrigin = typeof window !== 'undefined' ? window.location?.origin : 'http://localhost:5173'
) => {
  const base = apiBase || getApiBaseUrl();
  try {
    const parsed = new URL(base, baseWindowOrigin);
    return parsed.origin;
  } catch (err) {
    console.error(`[PS White Config] Failed to parse API origin from "${base}":`, err.message);
    return baseWindowOrigin;
  }
};

export const getCustomerGoogleAuthUrl = (apiBase, baseWindowOrigin) => {
  const origin = getApiOrigin(apiBase, baseWindowOrigin);
  return `${origin}/api/auth/google`;
};

export const getAdminGoogleAuthUrl = (apiBase, baseWindowOrigin) => {
  const origin = getApiOrigin(apiBase, baseWindowOrigin);
  return `${origin}/api/admin/auth/google`;
};

export default {
  getApiBaseUrl,
  getApiOrigin,
  getCustomerGoogleAuthUrl,
  getAdminGoogleAuthUrl,
};
