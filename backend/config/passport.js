import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import AdminWhitelist from '../models/AdminWhitelist.js';

const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error('Google account has no email'), false);
          }

          const whitelist = await AdminWhitelist.findOne({ email, active: true });
          if (!whitelist && email !== process.env.ADMIN_WHITELIST_EMAIL?.toLowerCase()) {
            return done(new Error('Email not whitelisted for admin access'), false);
          }

          const update = {
            email,
            googleId: profile.id,
            firstName: profile.name?.givenName || 'Admin',
            lastName: profile.name?.familyName || 'User',
            avatar: profile.photos?.[0]?.value,
            role: 'admin',
            emailVerified: true,
          };

          const adminUser = await User.findOneAndUpdate(
            { email },
            { $set: update },
            { new: true, upsert: true }
          );

          return done(null, adminUser);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
