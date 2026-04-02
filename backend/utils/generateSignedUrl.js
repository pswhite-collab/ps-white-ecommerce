import { getSignedDownloadUrl } from './r2.js';

export const generateSecureUrl = (
  key,
  {
    expiresIn = 24 * 60 * 60,
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
    expiresIn = 24 * 60 * 60,
  } = {}
) => {
  if (!key) {
    return null;
  }
  return getSignedDownloadUrl(key, expiresIn);
};

const generateSignedUrl = (key, expiresIn = 24 * 60 * 60) => {
  return generateSecureUrl(key, { expiresIn });
};

export default generateSignedUrl;
