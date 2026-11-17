import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import AdminWhitelist from '../models/AdminWhitelist.js';
import { isRegistrationAllowed } from '../utils/siteSettings.js';
import { getPrimaryClientUrl } from './clientUrl.js';

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
  const isProduction = process.env.NODE_ENV === 'production';
  const googleClientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID);
  const googleClientSecret = normalizeEnv(process.env.GOOGLE_CLIENT_SECRET);
  const googleAdminCallback = normalizeEnv(process.env.GOOGLE_ADMIN_CALLBACK_URL);
  const googleLegacyCallback = normalizeEnv(process.env.GOOGLE_CALLBACK_URL);
  const googleCustomerCallback = normalizeEnv(process.env.GOOGLE_CUSTOMER_CALLBACK_URL);

  if (!googleClientId || !googleClientSecret) {
    if (isProduction) {
      console.error(
        '[PS White Auth] FATAL: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in production.'
      );
    } else {
      console.warn('Google OAuth environment variables are missing.');
    }
    return;
  }

  const adminCallbackUrl =
    googleAdminCallback ||
    googleLegacyCallback ||
    'http://localhost:5000/api/admin/auth/google/callback';
  const customerCallbackUrl =
    googleCustomerCallback ||
    'http://localhost:5000/api/auth/google/callback';

  if (isProduction) {
    if (/localhost|127\.0\.0\.1/i.test(adminCallbackUrl)) {
      console.error(
        `[PS White Auth] WARNING: GOOGLE_ADMIN_CALLBACK_URL points to localhost in production: ${adminCallbackUrl}`
      );
    }
    if (/localhost|127\.0\.0\.1/i.test(customerCallbackUrl)) {
      console.error(
        `[PS White Auth] WARNING: GOOGLE_CUSTOMER_CALLBACK_URL points to localhost in production: ${customerCallbackUrl}`
      );
    }
  }

  // Admin Google Strategy
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
            return done(new Error('OAUTH_FAILED'), false);
          }

          const envWhitelist = process.env.ADMIN_WHITELIST_EMAIL?.toLowerCase();
          const whitelist = await AdminWhitelist.findOne({ email, active: true });

          if (!whitelist && email !== envWhitelist) {
            return done(new Error('ACCESS_DENIED'), false);
          }

          const existingUser = await User.findOne({ email });
          if (existingUser && existingUser.isActive === false) {
            return done(new Error('ACCOUNT_DISABLED'), false);
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
                isActive: true,
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

  // Customer Google Strategy
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
            return done(new Error('OAUTH_FAILED'), false);
          }

          let user = await User.findOne({
            $or: [{ email }, { googleId }],
          }).select('+password');

          if (user) {
            // Check if account is disabled (Defect J)
            if (user.isActive === false) {
              return done(new Error('ACCOUNT_DISABLED'), false);
            }

            // Defect I: Account pre-hijacking prevention
            // If the existing account has a password and was unverified, someone else may have registered it.
            // When the verified Google owner signs in, strip the unverified password so attacker is locked out.
            if (!user.emailVerified && user.password) {
              user = await User.findByIdAndUpdate(
                user._id,
                {
                  $set: {
                    googleId,
                    emailVerified: true,
                    firstName: user.firstName || firstName,
                    lastName: user.lastName || lastName,
                    avatar: user.avatar || avatar,
                  },
                  $unset: {
                    password: 1,
                    passwordResetToken: 1,
                    passwordResetExpires: 1,
                    emailVerificationToken: 1,
                    emailVerificationExpires: 1,
                  },
                },
                { new: true }
              );
              return done(null, user);
            }

            // Verified user: preserve existing password and link Google ID
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

          // New user registration
          const registrationAllowed = await isRegistrationAllowed();
          if (!registrationAllowed) {
            return done(new Error('REGISTRATION_CLOSED'), false);
          }

          user = await User.create({
            email,
            googleId,
            firstName,
            lastName,
            avatar,
            emailVerified: true,
            isActive: true,
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
