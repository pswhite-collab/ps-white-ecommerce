import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const extractToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

export const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid authentication token' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized request' });
  }
};

export default protect;
