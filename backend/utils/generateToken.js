import jwt from 'jsonwebtoken';

const isPlainObject = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const normalizeUserId = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') {
      return value.toHexString();
    }

    if (value._id) {
      return normalizeUserId(value._id);
    }

    if (value.id) {
      return normalizeUserId(value.id);
    }
  }

  return String(value);
};

const generateToken = (userId, extraPayload = {}) => {
  const payload = isPlainObject(userId)
    ? { ...userId, ...extraPayload }
    : { id: normalizeUserId(userId), ...extraPayload };

  if (!payload.id && !payload.sub) {
    throw new Error('Unable to generate auth token without a valid user identifier');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export default generateToken;
