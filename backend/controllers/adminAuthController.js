import generateToken from '../utils/generateToken.js';

export const googleStart = (_req, _res, next) => {
  next();
};

export const googleCallback = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Google OAuth failed' });
  }

  const token = generateToken({ id: req.user._id, role: req.user.role });
  return res.redirect(`${process.env.CLIENT_URL}/admin/login?token=${token}`);
};
