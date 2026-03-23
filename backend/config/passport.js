import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import AdminWhitelist from '../models/AdminWhitelist.js';

const normalizeEnv = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  const quotedWithDouble = trimmed.startsWith('"') && trimmed.endsWith('"');
  const quotedWithSingle = trimmed.startsWith("'") && trimmed.endsWith("'");

  if (quotedWithDouble || quotedWithSingle) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const configurePassport = () => {
  const googleClientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID);
  const googleClientSecret = normalizeEnv(process.env.GOOGLE_CLIENT_SECRET);
  const googleAdminCallback = normalizeEnv(process.env.GOOGLE_ADMIN_CALLBACK_URL);
  const googleLegacyCallback = normalizeEnv(process.env.GOOGLE_CALLBACK_URL);
  const googleCustomerCallback = normalizeEnv(process.env.GOOGLE_CUSTOMER_CALLBACK_URL);

  if (!googleClientId || !googleClientSecret) {
    console.warn('Google OAuth environment variables are missing.');
    return;
  }

  const adminCallbackUrl =
    googleAdminCallback ||
    googleLegacyCallback ||
    'http://localhost:5000/api/admin/auth/google/callback';
  const customerCallbackUrl =
    googleCustomerCallback ||
    'http://localhost:5000/api/auth/google/callback';

  passport.use(
    'google-admin',
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: adminCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error('No email received from Google'), false);
          }

          const envWhitelist = process.env.ADMIN_WHITELIST_EMAIL?.toLowerCase();
          const whitelist = await AdminWhitelist.findOne({ email, active: true });

          if (!whitelist && email !== envWhitelist) {
            return done(new Error('Access denied'), false);
          }

          const role = whitelist?.role === 'super_admin' ? 'super_admin' : 'admin';

          const user = await User.findOneAndUpdate(
            { email },
            {
              $set: {
                email,
                googleId: profile.id,
                firstName: profile.name?.givenName || 'Admin',
                lastName: profile.name?.familyName || '',
                avatar: profile.photos?.[0]?.value,
                role,
                emailVerified: true,
              },
            },
            { upsert: true, new: true }
          );

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.use(
    'google-customer',
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: customerCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const googleId = profile.id;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const avatar = profile.photos?.[0]?.value || '';

          if (!email || !googleId) {
            return done(new Error('Google profile is missing required account data'), false);
          }

          let user = await User.findOne({
            $or: [{ email }, { googleId }],
          });

          if (user) {
            const updates = {};
            if (!user.googleId) {
              updates.googleId = googleId;
            }
            if (!user.emailVerified) {
              updates.emailVerified = true;
            }
            if (!user.avatar && avatar) {
              updates.avatar = avatar;
            }
            if (!user.firstName && firstName) {
              updates.firstName = firstName;
            }
            if (!user.lastName && lastName) {
              updates.lastName = lastName;
            }

            if (Object.keys(updates).length > 0) {
              user = await User.findByIdAndUpdate(
                user._id,
                { $set: updates },
                { new: true }
              );
            }

            return done(null, user);
          }

          user = await User.create({
            email,
            googleId,
            firstName,
            lastName,
            avatar,
            emailVerified: true,
            role: 'customer',
          });

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
};

export default configurePassport;
