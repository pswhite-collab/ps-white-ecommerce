import AdminWhitelist from '../models/AdminWhitelist.js';
import generateToken from '../utils/generateToken.js';

export const googleAuth = (_req, _res, next) => {
  next();
};

export const googleCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Google OAuth failed' });
    }

    const token = generateToken(req.user._id, { role: req.user.role });

    const redirectUrl = new URL(`${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/login`);
    redirectUrl.searchParams.set('token', token);

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    return next(error);
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const envAllowed = process.env.ADMIN_WHITELIST_EMAIL?.toLowerCase();
    const whitelist = await AdminWhitelist.findOne({ email, active: true });

    if (!whitelist && email !== envAllowed) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    return res.json({
      success: true,
      data: {
        allowed: true,
        email,
        role: whitelist?.role || 'admin',
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminMe = async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const logoutAdmin = async (_req, res) => {
  return res.json({
    success: true,
    data: {
      message: 'Admin logged out',
    },
  });
};
