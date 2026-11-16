import AdminWhitelist from '../models/AdminWhitelist.js';

export const adminProtect = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Admin role required' });
    }

    const whitelisted = await AdminWhitelist.findOne({
      email: req.user.email.toLowerCase(),
      active: true,
    });

    if (!whitelisted) {
      return res.status(403).json({ success: false, error: 'Admin email is not whitelisted' });
    }

    req.adminAccess = whitelisted;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default adminProtect;
