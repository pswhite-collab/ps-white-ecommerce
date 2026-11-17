import './config/env.js';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import configurePassport from './config/passport.js';
import errorHandler from './middleware/errorHandler.js';
import checkMaintenanceMode from './middleware/maintenance.js';
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/adminAuth.js';
import bookRoutes from './routes/books.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import reviewRoutes from './routes/reviews.js';
import blogRoutes from './routes/blog.js';
import readingRoutes from './routes/reading.js';
import adminRoutes from './routes/admin.js';
import readerRoutes from './routes/reader.js';
import newsletterRoutes from './routes/newsletter.js';
import quoteRoutes from './routes/quotes.js';
import settingsRoutes from './routes/settings.js';
import { getAllowedOrigins } from './config/clientUrl.js';
import { checkEnv } from './utils/checkEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

// Enable trust proxy for accurate IP determination behind reverse proxies (Vercel, Nginx, Cloudflare)
const trustProxyEnv = process.env.TRUST_PROXY;
const trustProxyValue = trustProxyEnv !== undefined
  ? (trustProxyEnv === 'true' ? true : (trustProxyEnv === 'false' ? false : Number(trustProxyEnv) || 1))
  : 1;
app.set('trust proxy', trustProxyValue);

const allowedOrigins = getAllowedOrigins();

const helmetConfig = isProduction
  ? {
      referrerPolicy: { policy: 'no-referrer' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://js.stripe.com',
            'https://*.js.stripe.com',
            'https://accounts.google.com',
            'https://apis.google.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://res.cloudinary.com',
            'https://lh3.googleusercontent.com',
          ],
          connectSrc: [
            "'self'",
            'https://api.stripe.com',
            'https://*.stripe.com',
            'https://hooks.stripe.com',
            'https://m.stripe.network',
            'https://accounts.google.com',
            'https://www.googleapis.com',
          ],
          frameSrc: [
            "'self'",
            'https://js.stripe.com',
            'https://*.stripe.com',
            'https://hooks.stripe.com',
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    }
  : {
      referrerPolicy: { policy: 'no-referrer' },
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    };

configurePassport();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX || '250', 10),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet(helmetConfig));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use('/api/payment/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use('/api', limiter);
app.use('/api', checkMaintenanceMode);

app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Backend is running',
    timestamp: Date.now(),
    dbState: mongoose.connection.readyState,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/reader', readerRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: Date.now(),
    env: process.env.NODE_ENV || 'development',
    dbState: mongoose.connection.readyState,
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

if (isProduction) {
  app.use(
    express.static(frontendDistPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.includes(path.sep + 'assets' + path.sep) || filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

app.use(errorHandler);

export const startServer = async () => {
  try {
    if (isProduction) {
      const { valid, errors } = checkEnv(true);
      if (!valid) {
        console.error('[PS White Auth] FATAL: Production environment validation failed:');
        for (const err of errors) {
          console.error(`  - ${err}`);
        }
        process.exit(1);
      }
    }

    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    return server;
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test' && !process.env.TEST_IN_PROCESS) {
  startServer();
}

export { app };
export default app;
