import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateMeSchema,
} from '../utils/validation.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../utils/email.js';

const toUserPayload = (user) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  avatar: user.avatar,
  emailVerified: user.emailVerified,
  shippingAddress: user.shippingAddress,
  stats: user.stats,
});

const generateRawToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const email = value.email.toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const verificationToken = generateRawToken();
    const verificationTokenHash = hashToken(verificationToken);

    const user = await User.create({
      ...value,
      email,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const token = generateToken(user._id, { role: user.role });

    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

    await Promise.allSettled([
      sendVerificationEmail({
        to: user.email,
        firstName: user.firstName,
        verifyUrl,
      }),
      sendWelcomeEmail({
        to: user.email,
        firstName: user.firstName,
      }),
    ]);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: toUserPayload(user),
        message: 'Registration successful. Please verify your email.',
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const user = await User.findOne({ email: value.email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const validPassword = await user.comparePassword(value.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user._id, { role: user.role });

    return res.json({
      success: true,
      data: {
        token,
        user: toUserPayload(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Verification token is required' });
    }

    const hashed = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      data: {
        user: toUserPayload(user),
        message: 'Email verified successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const user = await User.findOne({ email: value.email.toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        data: { message: 'If an account exists, a password reset email has been sent.' },
      });
    }

    const resetToken = generateRawToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      resetUrl,
    });

    return res.json({
      success: true,
      data: { message: 'If an account exists, a password reset email has been sent.' },
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const hashed = hashToken(value.token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    user.password = value.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = generateToken(user._id, { role: user.role });

    return res.json({
      success: true,
      data: {
        message: 'Password reset successfully',
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (_req, res) => {
  return res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
};

export const getCurrentUser = async (req, res) => {
  return res.json({
    success: true,
    data: { user: toUserPayload(req.user) },
  });
};

export const updateCurrentUser = async (req, res, next) => {
  try {
    const { error, value } = updateMeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: value }, { new: true });

    return res.json({
      success: true,
      data: {
        user: toUserPayload(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};
