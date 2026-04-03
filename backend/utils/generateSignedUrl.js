import { getSignedDownloadUrl } from './r2.js';

const DEFAULT_SIGNED_URL_EXPIRES_IN = 60 * 60;

export const generateSecureUrl = (
  key,
  {
    expiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN,
  } = {}
) => {
  if (!key) {
    return null;
  }
  return getSignedDownloadUrl(key, expiresIn);
};

export const generateSecureDownloadUrl = (
  key,
  {
    expiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN,
  } = {}
) => {
  if (!key) {
    return null;
  }
  return getSignedDownloadUrl(key, expiresIn);
};

const generateSignedUrl = (key, expiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN) => {
  return generateSecureUrl(key, { expiresIn });
};

export default generateSignedUrl;
