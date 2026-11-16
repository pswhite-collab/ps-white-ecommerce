import '../config/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../server.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Settings from '../models/Settings.js';
import ReadingProgress from '../models/ReadingProgress.js';
import { getDevToken } from '../utils/devToken.js';
import { runSeed } from '../utils/seedDatabase.js';

let server;
let baseUrl;
let adminToken;
let anikaToken;
let rahulToken;
let cleanCustomerToken;

const apiRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };
  if (options.body && typeof options.body === 'object' && !(options.body instanceof Buffer)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, { ...options, headers });
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, body: data };
};

describe('Backend API Test Suite (pswhite_local)', () => {
  before(async () => {
    process.env.APP_ENV = 'local-test';
    await connectDB();
    const dbName = mongoose.connection.name;
    if (!dbName.endsWith('_local') && !dbName.endsWith('_test')) {
      throw new Error(`SAFETY ERROR: Connected to unsafe database: ${dbName}`);
    }

    // Ensure database is in fresh seeded state
    await runSeed();

    // Start server on an ephemeral port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    adminToken = await getDevToken('pswhite786@gmail.com');
    anikaToken = await getDevToken('anika@example.com');
    rahulToken = await getDevToken('rahul@example.com');
    cleanCustomerToken = await getDevToken('no_orders@example.com');
  });

  after(async () => {
    // Reset any modified settings
    await Settings.findByIdAndUpdate('site-settings', {
      allowRegistration: true,
      maintenanceMode: false,
      freeShippingThreshold: 50,
    });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  describe('5.1 Auth', () => {
    const testNewEmail = `testuser_${Date.now()}@example.com`;

    it('5.1.1 Register customer (201, password hashed in DB, role: customer)', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          email: testNewEmail,
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, testNewEmail);
      assert.equal(res.body.data.user.role, 'customer');

      const savedUser = await User.findOne({ email: testNewEmail }).select('+password');
      assert.ok(savedUser);
      assert.notEqual(savedUser.password, 'Password@123');
      assert.ok(bcrypt.compareSync('Password@123', savedUser.password));
    });

    it('5.1.2 Register with duplicate email returns 409', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          email: testNewEmail,
          password: 'Password@123',
          firstName: 'Duplicate',
          lastName: 'User',
        },
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    it('5.1.3 Register with weak password returns 400', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          email: `weak_${Date.now()}@example.com`,
          password: '123',
          firstName: 'Weak',
          lastName: 'Password',
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('5.1.4 Login valid customer returns 200 with JWT', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'anika@example.com',
          password: 'Password@123',
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.email, 'anika@example.com');
    });

    it('5.1.5 Login wrong password returns 401', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'anika@example.com',
          password: 'WrongPassword999!',
        },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('5.1.6 Protected route without token returns 401', async () => {
      const res = await apiRequest('/api/reading/library');
      assert.equal(res.status, 401);
    });

    it('5.1.7 Protected route with malformed token returns 401', async () => {
      const res = await apiRequest('/api/reading/library', {
        headers: { Authorization: 'Bearer this_is_definitely_not_a_valid_jwt' },
      });
      assert.equal(res.status, 401);
    });

    it('5.1.8 NoSQL injection attempt on login is rejected with 400', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: { $gt: '' },
          password: 'Password@123',
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

  describe('5.2 Site Settings & Maintenance', () => {
    it('5.2.1 GET /api/settings/public works without auth', async () => {
      const res = await apiRequest('/api/settings/public');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.settings);
      assert.equal(typeof res.body.data.settings.allowRegistration, 'boolean');
      assert.equal(typeof res.body.data.settings.maintenanceMode, 'boolean');
    });

    it('5.2.2 PUT /api/admin/settings requires admin role (401 without auth, 403 for customer)', async () => {
      const noAuth = await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: { siteName: 'Hacked' },
      });
      assert.equal(noAuth.status, 401);

      const customerAuth = await apiRequest('/api/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${anikaToken}` },
        body: { siteName: 'Hacked' },
      });
      assert.equal(customerAuth.status, 403);

      const adminAuth = await apiRequest('/api/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { siteName: 'PS White' },
      });
      assert.equal(adminAuth.status, 200);
      assert.equal(adminAuth.body.success, true);
    });

    it('5.2.3 When allowRegistration: false, POST /api/auth/register returns 403', async () => {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { allowRegistration: false },
      });

      const regRes = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          email: `blocked_${Date.now()}@example.com`,
          password: 'Password@123',
          firstName: 'Blocked',
          lastName: 'User',
        },
      });
      assert.equal(regRes.status, 403);

      // Restore allowRegistration
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { allowRegistration: true },
      });
    });

    it('5.2.4 When maintenanceMode: true, normal routes return 503 while whitelisted and admin routes bypass', async () => {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { maintenanceMode: true },
      });

      try {
        // Normal unauthenticated request returns 503
        const blocked = await apiRequest('/api/books');
        assert.equal(blocked.status, 503);

        // Whitelisted public settings returns 200
        const publicSettings = await apiRequest('/api/settings/public');
        assert.equal(publicSettings.status, 200);

        // Whitelisted health check returns 200
        const health = await apiRequest('/health');
        assert.equal(health.status, 200);

        // Admin request bypasses maintenance
        const adminReq = await apiRequest('/api/books', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.equal(adminReq.status, 200);
      } finally {
        // Always restore maintenanceMode
        await apiRequest('/api/admin/settings', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { maintenanceMode: false },
        });
      }
    });

    it('5.2.5 Free shipping threshold logic applies correctly', async () => {
      const book = await Book.findOne({ title: 'Paper Lanterns in the Mist' });
      assert.ok(book);

      // Subtotal: 3 * 21.99 = 65.97 >= $50 -> shipping cost should be $0
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: {
          items: [{ book: book._id, format: 'physical', quantity: 3 }],
          shippingAddress: {
            firstName: 'Nora',
            lastName: 'Oders',
            address: '100 Test St',
            city: 'Portland',
            state: 'OR',
            country: 'USA',
            postalCode: '97201',
            phone: '555-123-4567',
          },
          currency: 'USD',
          paymentMethod: 'stripe',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.order.shipping.cost, 0);
      assert.equal(res.body.data.order.total, res.body.data.order.subtotal);
    });
  });

  describe('5.3 Books & Catalogue', () => {
    it('5.3.1 GET /api/books returns active books with default limit 8', async () => {
      const res = await apiRequest('/api/books');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.books.length <= 8);
      assert.ok(res.body.data.books.length > 0);
      assert.equal(res.body.data.pagination.limit, 8);
      // All returned books must be active
      for (const b of res.body.data.books) {
        assert.equal(b.active, true);
      }
    });

    it('5.3.2 Filter by genre, format, and featured', async () => {
      const thriller = await apiRequest('/api/books?genre=Thriller');
      assert.equal(thriller.status, 200);
      for (const b of thriller.body.data.books) {
        assert.ok(b.genres.includes('Thriller'));
      }

      const ebookOnly = await apiRequest('/api/books?format=ebook');
      assert.equal(ebookOnly.status, 200);
      for (const b of ebookOnly.body.data.books) {
        assert.equal(b.formats?.ebook?.available, true);
      }

      const featured = await apiRequest('/api/books?featured=true');
      assert.equal(featured.status, 200);
      for (const b of featured.body.data.books) {
        assert.equal(b.featured, true);
      }
    });

    it('5.3.3 Search with special regex characters does not crash (no 500)', async () => {
      const res = await apiRequest('/api/books?search=(');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it('5.3.4 GET /api/books/:id for valid id returns book with reviews', async () => {
      const book = await Book.findOne({ title: 'The Weight of Silence' });
      assert.ok(book);
      const res = await apiRequest(`/api/books/${book._id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data.book.title, 'The Weight of Silence');
      assert.ok(Array.isArray(res.body.data.book.reviews));
    });

    it('5.3.5 GET /api/books/not-an-objectid returns 404', async () => {
      const res = await apiRequest('/api/books/not-an-objectid');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    it('5.3.6 GET /api/books/:id for inactive book returns 404 for guest, 200 for admin', async () => {
      const inactive = await Book.findOne({ active: false });
      assert.ok(inactive, 'Inactive book should exist in seeds');

      const guestRes = await apiRequest(`/api/books/${inactive._id}`);
      assert.equal(guestRes.status, 404);

      const adminRes = await apiRequest(`/api/books/${inactive._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(adminRes.status, 200);
      assert.equal(adminRes.body.data.book.title, inactive.title);
    });

    it('5.3.7 maxPrice query param returns books with price <= maxPrice', async () => {
      const res = await apiRequest('/api/books?maxPrice=12');
      assert.equal(res.status, 200);
      for (const b of res.body.data.books) {
        const prices = [
          b.formats?.ebook?.price,
          b.formats?.physical?.price,
          b.formats?.audiobook?.price,
        ].filter((p) => typeof p === 'number');
        const minPrice = Math.min(...prices);
        assert.ok(minPrice <= 12, `Book ${b.title} price ${minPrice} exceeds maxPrice 12`);
      }
    });
  });

  describe('5.4 Reviews', () => {
    it('5.4.1 Customer who purchased book can submit review (201)', async () => {
      const book = await Book.findOne({ title: 'Paper Lanterns in the Mist' });
      assert.ok(book);

      // Rahul owns Paper Lanterns in the Mist in seeded demo orders (status: processing)
      const res = await apiRequest('/api/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${rahulToken}` },
        body: {
          bookId: book._id,
          rating: 5,
          title: 'Masterpiece of modern prose',
          comment: 'Every sentence felt like a quiet realization. Truly magnificent.',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
    });

    it('5.4.2 Same customer cannot submit a second review for the same book (400)', async () => {
      const book = await Book.findOne({ title: 'Paper Lanterns in the Mist' });
      const res = await apiRequest('/api/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${rahulToken}` },
        body: {
          bookId: book._id,
          rating: 4,
          title: 'Second review attempt',
          comment: 'Attempting duplicate review.',
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('5.4.3 Review rating must be integer 1-5', async () => {
      const book = await Book.findOne({ title: 'Paper Lanterns in the Mist' });
      const resInvalid = await apiRequest('/api/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${rahulToken}` },
        body: {
          bookId: book._id,
          rating: 6,
          title: 'Invalid Rating',
          comment: 'Rating is out of bounds.',
        },
      });
      assert.equal(resInvalid.status, 400);
    });

    it('5.4.4 Only approved reviews appear on GET /api/reviews/book/:bookId', async () => {
      const book = await Book.findOne({ title: 'The Weight of Silence' });
      const res = await apiRequest(`/api/reviews/book/${book._id}`);
      assert.equal(res.status, 200);
      for (const r of res.body.data.reviews) {
        assert.equal(r.status, 'approved');
      }
    });
  });

  describe('5.5 Orders & Stock', () => {
    it('5.5.1 Digital-only order requires no physical shipping address', async () => {
      const book = await Book.findOne({ title: 'The Architecture of Rain' });
      assert.ok(book);

      const res = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: {
          items: [{ book: book._id, format: 'ebook', quantity: 1 }],
          currency: 'USD',
          paymentMethod: 'stripe',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.order.shipping.cost, 0);
      assert.equal(res.body.data.order.shippingAddress, undefined);
    });

    it('5.5.2 Physical order without shipping address is rejected with 400', async () => {
      const book = await Book.findOne({ title: 'Shadows on the Verandah' });
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: {
          items: [{ book: book._id, format: 'physical', quantity: 1 }],
          currency: 'USD',
          paymentMethod: 'stripe',
        },
      });
      assert.equal(res.status, 400);
    });

    it('5.5.3 Creating physical order decrements book stock', async () => {
      const bookBefore = await Book.findOne({ title: 'Letters to an Absent River' });
      const initialStock = bookBefore.formats.physical.stock;
      assert.ok(initialStock >= 1);

      const res = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: {
          items: [{ book: bookBefore._id, format: 'physical', quantity: 1 }],
          shippingAddress: {
            firstName: 'Nora',
            lastName: 'Oders',
            address: '100 Test St',
            city: 'Portland',
            state: 'OR',
            country: 'USA',
            postalCode: '97201',
            phone: '555-123-4567',
          },
          currency: 'USD',
          paymentMethod: 'stripe',
        },
      });

      assert.equal(res.status, 201);
      const bookAfter = await Book.findById(bookBefore._id);
      assert.equal(bookAfter.formats.physical.stock, initialStock - 1);
    });

    it('5.5.4 Ordering more than available stock is rejected with 400', async () => {
      const zeroStockBook = await Book.findOne({ title: 'The Last Boat to Cochin' });
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: {
          items: [{ book: zeroStockBook._id, format: 'physical', quantity: 1 }],
          shippingAddress: {
            firstName: 'Nora',
            lastName: 'Oders',
            address: '100 Test St',
            city: 'Portland',
            state: 'OR',
            country: 'USA',
            postalCode: '97201',
            phone: '555-123-4567',
          },
          currency: 'USD',
          paymentMethod: 'stripe',
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('5.5.5 Customer A cannot read Customer B order by ID (IDOR prevention returns 403)', async () => {
      const rahulOrder = await Order.findOne({ user: (await User.findOne({ email: 'rahul@example.com' }))._id });
      assert.ok(rahulOrder);

      const res = await apiRequest(`/api/orders/${rahulOrder._id}`, {
        headers: { Authorization: `Bearer ${anikaToken}` },
      });
      assert.equal(res.status, 403);
    });

    it('5.5.6 Price tampering: client sending manipulated item price is ignored and recalculated from DB', async () => {
      const book = await Book.findOne({ title: 'Between Two Dawns' });
      const realEbookPrice = book.formats.ebook.price;

      const res = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: {
          items: [{ book: book._id, format: 'ebook', quantity: 1, price: 0.01 }],
          currency: 'USD',
          paymentMethod: 'stripe',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.order.items[0].price, realEbookPrice);
      assert.equal(res.body.data.order.subtotal, realEbookPrice);
    });
  });

  describe('5.6 Stripe Payment Flow', () => {
    let testOrder;

    before(async () => {
      const book = await Book.findOne({ title: 'The Weight of Silence' });
      const createRes = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: {
          items: [{ book: book._id, format: 'ebook', quantity: 1 }],
          currency: 'USD',
          paymentMethod: 'stripe',
        },
      });
      testOrder = createRes.body.data.order;
    });

    it('5.6.1 POST /api/payment/stripe/create-intent creates PaymentIntent matching order amount & currency', async () => {
      const res = await apiRequest('/api/payment/stripe/create-intent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: { orderId: testOrder._id },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.clientSecret);
      assert.ok(res.body.data.paymentIntentId);
    });

    it('5.6.2 Calling create-intent twice for the same order returns the SAME client secret (idempotent)', async () => {
      const res1 = await apiRequest('/api/payment/stripe/create-intent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: { orderId: testOrder._id },
      });
      const res2 = await apiRequest('/api/payment/stripe/create-intent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: { orderId: testOrder._id },
      });

      assert.equal(res1.status, 200);
      assert.equal(res2.status, 200);
      assert.equal(res1.body.data.clientSecret, res2.body.data.clientSecret);
      assert.equal(res1.body.data.paymentIntentId, res2.body.data.paymentIntentId);
    });

    it('5.6.3 POST /api/payment/stripe/confirm verifies payment and rejects invalid intent IDs', async () => {
      const res = await apiRequest('/api/payment/stripe/confirm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
        body: { orderId: testOrder._id, paymentIntentId: 'invalid_id' },
      });
      assert.equal(res.status, 400);
    });

    it('5.6.4 Webhook endpoint rejects invalid signatures with 400', async () => {
      const res = await apiRequest('/api/payment/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=fake_signature',
        },
        body: { type: 'payment_intent.succeeded' },
      });
      assert.equal(res.status, 400);
    });
  });

  describe('5.7 Admin Operations', () => {
    let createdBookId;

    it('5.7.1 Non-admin calling /api/admin/* gets 401 or 403', async () => {
      const guestRes = await apiRequest('/api/admin/dashboard');
      assert.equal(guestRes.status, 401);

      const customerRes = await apiRequest('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${anikaToken}` },
      });
      assert.equal(customerRes.status, 403);
    });

    it('5.7.2 Admin can create, update, and delete book (CRUD)', async () => {
      // Create
      const createRes = await apiRequest('/api/books', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          title: 'Ephemeral Horizon',
          subtitle: 'A Fleeting Memory',
          description: 'A study of time and distance.',
          genres: ['Literary Fiction'],
          formats: {
            ebook: { available: true, price: 9.99, pageCount: 150 },
          },
          active: true,
        },
      });
      assert.equal(createRes.status, 201);
      assert.equal(createRes.body.success, true);
      createdBookId = createRes.body.data.book._id;

      // Update
      const updateRes = await apiRequest(`/api/books/${createdBookId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          title: 'Ephemeral Horizon (Revised Edition)',
        },
      });
      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.data.book.title, 'Ephemeral Horizon (Revised Edition)');

      // Delete
      const deleteRes = await apiRequest(`/api/books/${createdBookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(deleteRes.status, 200);
    });

    it('5.7.3 Admin can update order tracking and carrier', async () => {
      const order = await Order.findOne({ 'items.format': 'physical' });
      assert.ok(order);

      const res = await apiRequest(`/api/orders/${order._id}/tracking`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          carrier: 'FedEx',
          trackingNumber: 'FDX987654321',
          autoNotify: false,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.order.shipping.carrier, 'FedEx');
      assert.equal(res.body.data.order.shipping.trackingNumber, 'FDX987654321');
    });

    it('5.7.4 Admin can view customer list with order summaries and spend totals', async () => {
      const res = await apiRequest('/api/admin/customers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.customers));
      assert.ok(res.body.data.customers.length >= 9);

      const anikaData = res.body.data.customers.find((c) => c.email === 'anika@example.com');
      assert.ok(anikaData);
      assert.ok(anikaData.orderSummary);
      assert.equal(typeof anikaData.orderSummary.totalSpent, 'number');
    });
  });

  describe('5.8 Uploads & Static Files', () => {
    it('5.8.1 Sample EPUB, PDF, and MP3 files are downloadable via sample endpoints', async () => {
      const epub = await apiRequest('/api/reader/sample/epub');
      assert.equal(epub.status, 200);

      const pdf = await apiRequest('/api/reader/sample/pdf');
      assert.equal(pdf.status, 200);

      const mp3 = await apiRequest('/api/reader/sample/mp3');
      assert.equal(mp3.status, 200);
    });

    it('5.8.2 Unauthenticated user cannot download full book content (401)', async () => {
      const book = await Book.findOne({ title: 'The Weight of Silence' });
      const res = await apiRequest(`/api/reader/${book._id}/content`);
      assert.equal(res.status, 401);
    });

    it('5.8.3 Authenticated user who has not bought the book gets 403 on download', async () => {
      const book = await Book.findOne({ title: 'Between Two Dawns' });
      // Nora (cleanCustomerToken) has not bought Between Two Dawns
      const res = await apiRequest(`/api/reader/${book._id}/content`, {
        headers: { Authorization: `Bearer ${cleanCustomerToken}` },
      });
      assert.equal(res.status, 403);
    });
  });

  describe('5.9 Reader & Library', () => {
    it('5.9.1 Customer can fetch owned books in their library', async () => {
      const res = await apiRequest('/api/reading/library', {
        headers: { Authorization: `Bearer ${anikaToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.library));
      assert.ok(res.body.data.library.length >= 1);
    });

    it('5.9.2 Reading progress save and resume persists and can be retrieved', async () => {
      const book = await Book.findOne({ title: 'The Weight of Silence' });

      // Save page progress
      const updateRes = await apiRequest(`/api/reading/progress/${book._id}/page`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${anikaToken}` },
        body: {
          currentPage: 75,
          totalPages: 320,
          progressPercentage: 23.4,
          readingTimeSeconds: 600,
        },
      });
      assert.equal(updateRes.status, 200);

      // Add a bookmark
      const bookmarkRes = await apiRequest(`/api/reading/progress/${book._id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${anikaToken}` },
        body: {
          page: 75,
          title: 'Crucial turning point',
          note: 'Remember this scene',
        },
      });
      assert.equal(bookmarkRes.status, 200);

      // Retrieve progress
      const getRes = await apiRequest(`/api/reading/progress/${book._id}`, {
        headers: { Authorization: `Bearer ${anikaToken}` },
      });
      assert.equal(getRes.status, 200);
      assert.equal(getRes.body.data.progress.currentPage, 75);
      assert.ok(getRes.body.data.progress.bookmarks.length >= 1);
    });
  });

  describe('5.10 Security Sanity', () => {
    it('5.10.1 Helmet headers are present on responses', async () => {
      const res = await apiRequest('/health');
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    });

    it('5.10.2 Unknown API route returns JSON 404', async () => {
      const res = await apiRequest('/api/non-existent-endpoint');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error);
    });
  });
});
