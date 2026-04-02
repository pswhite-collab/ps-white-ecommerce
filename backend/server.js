import dotenv from 'dotenv';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_WWW,
  process.env.FRONTEND_URL,
  'https://ps-white-ecommerce-rose.vercel.app',
  'https://ps-white.com',
  'https://www.ps-white.com',
].filter(Boolean);

const helmetConfig = isProduction
  ? {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://checkout.razorpay.com',
            'https://js.stripe.com',
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
            'https://api.razorpay.com',
            'https://api.stripe.com',
            'https://checkout.razorpay.com',
            'https://accounts.google.com',
            'https://www.googleapis.com',
          ],
          frameSrc: ["'self'", 'https://checkout.razorpay.com', 'https://js.stripe.com'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    }
  : {
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
  app.use(express.static(frontendDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
