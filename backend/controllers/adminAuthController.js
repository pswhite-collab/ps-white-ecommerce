import AdminWhitelist from '../models/AdminWhitelist.js';
import generateToken from '../utils/generateToken.js';
import { getPrimaryClientUrl } from '../config/clientUrl.js';

export const googleAuth = (_req, _res, next) => {
  next();
};

export const googleCallback = async (req, res, next) => {
  try {
    const primaryClient = getPrimaryClientUrl();
    if (!req.user) {
      const redirectUrl = new URL('/admin/login', primaryClient);
      redirectUrl.searchParams.set('error', 'access_denied');
      return res.redirect(redirectUrl.toString());
    }

    const token = generateToken(req.user._id, { role: req.user.role });
    return res.redirect(`${primaryClient}/admin/login#token=${encodeURIComponent(token)}`);
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
