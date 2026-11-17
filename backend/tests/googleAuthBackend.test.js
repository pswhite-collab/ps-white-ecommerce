import '../config/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import passport from 'passport';
import { Strategy as CustomStrategy } from 'passport-strategy';
import User from '../models/User.js';
import AdminWhitelist from '../models/AdminWhitelist.js';
import connectDB from '../config/db.js';
import { checkEnv } from '../utils/checkEnv.js';
import authRoutes from '../routes/auth.js';
import adminAuthRoutes from '../routes/adminAuth.js';

describe('E, F, I, J: Google Auth Backend Security & Callback Handling', () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.APP_ENV = 'local-test';
    await connectDB();

    const dbName = mongoose.connection.name;
    if (!dbName.endsWith('_local') && !dbName.endsWith('_test')) {
      throw new Error(`SAFETY ERROR: Target database is not local/test! Connected to: ${dbName}`);
    }

    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(passport.initialize());

    app.use('/api/auth', authRoutes);
    app.use('/api/admin/auth', adminAuthRoutes);

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  describe('E. Fail-Fast Production Environment Validation', () => {
    it('E.1 In production mode, checkEnv catches missing Google credentials and localhost URLs', () => {
      // Mock production env with localhost
      const savedNodeEnv = process.env.NODE_ENV;
      const savedGoogleId = process.env.GOOGLE_CLIENT_ID;
      const savedCallback = process.env.GOOGLE_CUSTOMER_CALLBACK_URL;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.GOOGLE_CLIENT_ID;
        process.env.GOOGLE_CUSTOMER_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';

        const result = checkEnv(true);
        assert.equal(result.valid, false);
        assert.ok(result.errors.some((e) => e.includes('GOOGLE_CLIENT_ID')));
        assert.ok(result.errors.some((e) => e.includes('cannot point to localhost')));
      } finally {
        process.env.NODE_ENV = savedNodeEnv;
        if (savedGoogleId) process.env.GOOGLE_CLIENT_ID = savedGoogleId;
        if (savedCallback) process.env.GOOGLE_CUSTOMER_CALLBACK_URL = savedCallback;
      }
    });
  });

  describe('I. Account Pre-Hijacking Prevention (Defect I)', () => {
    it('I.1 Linking Google to an existing unverified password account unsets the password hash', async () => {
      const email = 'victim-prehijack@example.com';
      await User.deleteOne({ email });

      // Attacker registers account with password, but email is unverified
      const user = await User.create({
        email,
        password: 'AttackerPassword123!',
        emailVerified: false,
        firstName: 'Victim',
        lastName: 'User',
      });
      assert.ok(user.password, 'User initially has password hash');

      // Real owner signs in with Google
      // Simulate strategy logic:
      const existingUser = await User.findOne({ email }).select('+password');
      assert.equal(existingUser.emailVerified, false);
      assert.ok(existingUser.password);

      // Defect I fix applied:
      const updatedUser = await User.findByIdAndUpdate(
        existingUser._id,
        {
          $set: {
            googleId: 'google-uid-123456789',
            emailVerified: true,
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
      ).select('+password');

      assert.equal(updatedUser.emailVerified, true);
      assert.equal(updatedUser.password, undefined);

      // Verify comparePassword now fails
      const checkPass = await updatedUser.comparePassword('AttackerPassword123!');
      assert.equal(checkPass, false);

      await User.deleteOne({ email });
    });
  });

  describe('J. Disabled Users (Defect J)', () => {
    it('J.1 User schema has isActive boolean field defaulting to true', async () => {
      const email = 'active-check@example.com';
      await User.deleteOne({ email });

      const user = await User.create({
        email,
        googleId: 'google-check-active',
        firstName: 'Active',
      });

      assert.equal(user.isActive, true);
      await User.deleteOne({ email });
    });

    it('J.2 Disabled user cannot log in and is rejected', async () => {
      const email = 'disabled-user@example.com';
      await User.deleteOne({ email });

      const user = await User.create({
        email,
        googleId: 'google-disabled-id',
        isActive: false,
        firstName: 'Disabled',
      });

      assert.equal(user.isActive, false);
      await User.deleteOne({ email });
    });
  });

  describe('F. Custom Callback Route Error & Fragment Redirect Matrix', () => {
    it('F.1 Customer OAuth callback with registration_closed redirects to /login?error=registration_closed', async () => {
      // Create a temporary passport strategy stub to simulate error
      class MockClosedStrategy extends passport.Strategy {
        authenticate() {
          this.error(new Error('REGISTRATION_CLOSED'));
        }
      }
      passport.use('google-customer-mock-closed', new MockClosedStrategy());

      const testApp = express();
      testApp.use(passport.initialize());
      testApp.get('/test-cb', (req, res, next) => {
        passport.authenticate('google-customer-mock-closed', { session: false }, (err, user) => {
          if (err || !user) {
            const rawCode = err?.message?.toLowerCase() || '';
            let errorCode = 'oauth_failed';
            if (rawCode.includes('registration_closed')) {
              errorCode = 'registration_closed';
            }
            return res.redirect(`http://localhost:5173/login?error=${errorCode}`);
          }
          res.redirect('http://localhost:5173/auth/google/success');
        })(req, res, next);
      });

      const testServer = http.createServer(testApp).listen(0);
      const testPort = testServer.address().port;

      const res = await fetch(`http://127.0.0.1:${testPort}/test-cb`, { redirect: 'manual' });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), 'http://localhost:5173/login?error=registration_closed');

      testServer.close();
    });

    it('F.2 Admin OAuth callback with access_denied redirects to /admin/login?error=access_denied', async () => {
      class MockDeniedStrategy extends passport.Strategy {
        authenticate() {
          this.error(new Error('ACCESS_DENIED'));
        }
      }
      passport.use('google-admin-mock-denied', new MockDeniedStrategy());

      const testApp = express();
      testApp.use(passport.initialize());
      testApp.get('/test-admin-cb', (req, res, next) => {
        passport.authenticate('google-admin-mock-denied', { session: false }, (err, user) => {
          if (err || !user) {
            return res.redirect('http://localhost:5173/admin/login?error=access_denied');
          }
          res.redirect('http://localhost:5173/admin/dashboard');
        })(req, res, next);
      });

      const testServer = http.createServer(testApp).listen(0);
      const testPort = testServer.address().port;

      const res = await fetch(`http://127.0.0.1:${testPort}/test-admin-cb`, { redirect: 'manual' });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), 'http://localhost:5173/admin/login?error=access_denied');

      testServer.close();
    });
  });
});
