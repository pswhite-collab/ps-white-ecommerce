import cloudinary from '../config/cloudinary.js';

export const generateSecureUrl = (
  publicId,
  {
    expiresIn = 24 * 60 * 60,
    resourceType = 'raw',
    type = 'private',
    format,
  } = {}
) => {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type,
    sign_url: true,
    secure: true,
    timestamp,
    format,
  });
};

const generateSignedUrl = (publicId, expiresIn = 24 * 60 * 60) => {
  return generateSecureUrl(publicId, { expiresIn });
};

export default generateSignedUrl;
