import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import AdminWhitelist from '../models/AdminWhitelist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:5000';
const PASSWORD = 'Test1234';

const results = [];

const addResult = (status, name, detail = '') => {
  results.push({ status, name, detail });
  console.log(`${status} | ${name}${detail ? ` | ${detail}` : ''}`);
};

const pass = (name, detail = '') => addResult('PASS', name, detail);
const fail = (name, detail = '') => addResult('FAIL', name, detail);
const blocked = (name, detail = '') => addResult('BLOCKED', name, detail);

const summarize = () => {
  const summary = results.reduce(
    (acc, row) => {
      acc[row.status.toLowerCase()] += 1;
      return acc;
    },
    { pass: 0, fail: 0, blocked: 0 }
  );

  console.log(
    `\nDEEP_SMOKE_SUMMARY ${JSON.stringify({
      total: results.length,
      ...summary,
      baseUrl: BASE_URL,
    })}`
  );

  if (summary.fail > 0) {
    process.exitCode = 1;
  }
};

const request = async (method, endpoint, { token, body } = {}) => {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_error) {
    json = null;
  }

  return {
    status: response.status,
    ok: response.ok,
    json,
    text,
  };
};

const expectStatus = (name, response, allowedStatuses) => {
  if (allowedStatuses.includes(response.status)) {
    pass(name, `status=${response.status}`);
    return true;
  }

  const message =
    response.json?.error ||
    response.json?.message ||
    response.json?.details ||
    response.text?.slice(0, 180) ||
    'Unexpected response';
  fail(name, `status=${response.status}, expected=${allowedStatuses.join('/')}, message=${message}`);
  return false;
};

const ensureAdminRole = async (email) => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 4,
  });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error(`Admin candidate user not found: ${email}`);
  }

  if (user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }

  await AdminWhitelist.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { active: true, role: 'admin' } },
    { upsert: true, new: true }
  );

  await mongoose.disconnect();
};

const registerAndLogin = async ({ email, firstName, lastName }) => {
  const register = await request('POST', '/api/auth/register', {
    body: {
      email,
      password: PASSWORD,
      firstName,
      lastName,
    },
  });
  expectStatus(`register ${email}`, register, [201, 409]);

  const login = await request('POST', '/api/auth/login', {
    body: {
      email,
      password: PASSWORD,
    },
  });
  if (!expectStatus(`login ${email}`, login, [200])) {
    return { token: '', user: null };
  }

  return {
    token: login.json?.data?.token || '',
    user: login.json?.data?.user || null,
  };
};

const normalizeSettingsPayload = (settings) => ({
  siteName: settings.siteName,
  siteDescription: settings.siteDescription,
  siteEmail: settings.siteEmail,
  allowRegistration: Boolean(settings.allowRegistration),
  maintenanceMode: Boolean(settings.maintenanceMode),
  freeShippingThreshold: Number(settings.freeShippingThreshold ?? 0),
  currency: settings.currency || 'USD',
  timezone: settings.timezone || 'America/New_York',
});

const run = async () => {
  const runId = Date.now();
  const customerEmail = `smoke_customer_${runId}@example.com`;
  const adminEmail = `smoke_admin_${runId}@example.com`;

  let customerToken = '';
  let adminToken = '';
  let customerId = '';
  let adminPostId = '';
  let adminQuoteId = '';
  let reviewId = '';
  let ebookBookId = '';
  let physicalBookId = '';
  let ebookOrderId = '';
  let physicalOrderId = '';
  let originalSettings = null;

  try {
    const health = await request('GET', '/health');
    expectStatus('health', health, [200]);

    const apiTest = await request('GET', '/api/test');
    expectStatus('api test', apiTest, [200]);

    const customerAuth = await registerAndLogin({
      email: customerEmail,
      firstName: 'Smoke',
      lastName: 'Customer',
    });
    customerToken = customerAuth.token;

    if (!customerToken) {
      fail('customer token acquisition', 'Unable to acquire customer token');
      summarize();
      return;
    }

    const customerMe = await request('GET', '/api/auth/me', { token: customerToken });
    if (expectStatus('customer /auth/me', customerMe, [200])) {
      customerId = customerMe.json?.data?.user?.id || '';
    }

    const adminAuth = await registerAndLogin({
      email: adminEmail,
      firstName: 'Smoke',
      lastName: 'Admin',
    });

    await ensureAdminRole(adminEmail);

    const adminLogin = await request('POST', '/api/auth/login', {
      body: { email: adminEmail, password: PASSWORD },
    });
    if (expectStatus('admin login', adminLogin, [200])) {
      adminToken = adminLogin.json?.data?.token || '';
    }

    if (!adminToken) {
      fail('admin token acquisition', 'Unable to acquire admin token');
      summarize();
      return;
    }

    const verifyAdmin = await request('POST', '/api/admin/auth/verify-admin', {
      body: { email: adminEmail },
    });
    expectStatus('verify admin whitelist', verifyAdmin, [200]);

    const booksResp = await request('GET', '/api/books?limit=200');
    if (expectStatus('books list', booksResp, [200])) {
      const books = booksResp.json?.data?.books || [];
      const featuredResp = await request('GET', '/api/books/featured');
      if (expectStatus('featured books list', featuredResp, [200])) {
        const featuredBooks = featuredResp.json?.data?.books || [];
        const allIds = new Set(books.map((book) => String(book._id)));
        const missingFeaturedIds = featuredBooks
          .map((book) => String(book._id))
          .filter((id) => !allIds.has(id));

        if (missingFeaturedIds.length === 0) {
          pass('featured books included in all books listing');
        } else {
          fail('featured books included in all books listing', `missing=${missingFeaturedIds.join(',')}`);
        }
      }

      const ebookBook = books.find((book) => book.formats?.ebook?.available);
      const physicalBook = books.find(
        (book) => book.formats?.physical?.available && Number(book.formats?.physical?.stock || 0) > 0
      );

      if (ebookBook) {
        ebookBookId = String(ebookBook._id);
        pass('ebook test book resolved', ebookBookId);
      } else {
        fail('ebook test book resolved', 'No active ebook-available book found');
      }

      if (physicalBook) {
        physicalBookId = String(physicalBook._id);
        pass('physical test book resolved', physicalBookId);
      } else {
        blocked('physical order+tracking flow', 'No active physical book with stock > 0');
      }
    }

    if (ebookBookId) {
      const orderResp = await request('POST', '/api/orders', {
        token: customerToken,
        body: {
          items: [{ book: ebookBookId, format: 'ebook', quantity: 1 }],
          paymentMethod: 'razorpay',
          currency: 'INR',
        },
      });

      if (expectStatus('create ebook order', orderResp, [201])) {
        ebookOrderId = orderResp.json?.data?.order?._id || '';
      }

      if (ebookOrderId) {
        const adminAllOrders = await request('GET', '/api/orders/all', { token: adminToken });
        expectStatus('admin get all orders', adminAllOrders, [200]);

        const updateStatus = await request('PUT', `/api/orders/${ebookOrderId}/status`, {
          token: adminToken,
          body: { status: 'processing' },
        });
        expectStatus('admin update order status', updateStatus, [200]);

        const createReviewResp = await request('POST', '/api/reviews', {
          token: customerToken,
          body: {
            bookId: ebookBookId,
            rating: 5,
            title: `Smoke Review ${runId}`,
            comment: `Automated smoke review ${runId}`,
          },
        });

        if (expectStatus('customer create review after purchase', createReviewResp, [201])) {
          reviewId = createReviewResp.json?.data?.review?._id || '';
        }

        if (reviewId) {
          const adminReviews = await request('GET', '/api/reviews/admin', { token: adminToken });
          expectStatus('admin get reviews', adminReviews, [200]);

          const rejectReview = await request('PUT', `/api/reviews/${reviewId}/reject`, {
            token: adminToken,
          });
          expectStatus('admin reject review', rejectReview, [200]);

          const approveReview = await request('PUT', `/api/reviews/${reviewId}/approve`, {
            token: adminToken,
          });
          expectStatus('admin approve review', approveReview, [200]);
        }

        const readingProgressGet = await request('GET', `/api/reading/progress/${ebookBookId}`, {
          token: customerToken,
        });
        expectStatus('reading get progress', readingProgressGet, [200]);

        const readingProgressUpdate = await request('PUT', `/api/reading/progress/${ebookBookId}/page`, {
          token: customerToken,
          body: { currentPage: 5, totalPages: 100, readingMinutes: 12 },
        });
        expectStatus('reading update progress', readingProgressUpdate, [200]);

        const addBookmarkResp = await request('POST', `/api/reading/progress/${ebookBookId}/bookmark`, {
          token: customerToken,
          body: { page: 5, note: 'Smoke bookmark' },
        });
        expectStatus('reading add bookmark', addBookmarkResp, [200]);

        const updateReaderSettingsResp = await request(
          'PUT',
          `/api/reading/progress/${ebookBookId}/settings`,
          {
            token: customerToken,
            body: { fontSize: 110, theme: 'light' },
          }
        );
        expectStatus('reading update settings', updateReaderSettingsResp, [200]);

        const readingStatsResp = await request('GET', '/api/reading/stats', {
          token: customerToken,
        });
        expectStatus('reading stats', readingStatsResp, [200]);

        const readerPreviewResp = await request('GET', `/api/reader/${ebookBookId}/preview`);
        expectStatus('reader preview', readerPreviewResp, [200]);

        const readerMetadataResp = await request('GET', `/api/reader/${ebookBookId}/metadata`, {
          token: customerToken,
        });
        expectStatus('reader metadata', readerMetadataResp, [200]);

        const readerContentResp = await request('GET', `/api/reader/${ebookBookId}/content`, {
          token: customerToken,
        });
        expectStatus('reader content', readerContentResp, [200]);

        const completeResp = await request('POST', `/api/reading/progress/${ebookBookId}/complete`, {
          token: customerToken,
        });
        expectStatus('reading mark completed', completeResp, [200]);

        const paymentOrderResp = await request('POST', '/api/orders', {
          token: customerToken,
          body: {
            items: [{ book: ebookBookId, format: 'ebook', quantity: 1 }],
            paymentMethod: 'razorpay',
            currency: 'INR',
          },
        });

        let paymentOrderId = '';
        if (expectStatus('create payment test order', paymentOrderResp, [201])) {
          paymentOrderId = paymentOrderResp.json?.data?.order?._id || '';
        }

        if (paymentOrderId) {
          const razorpayCreate = await request('POST', '/api/payment/razorpay/create-order', {
            token: customerToken,
            body: { orderId: paymentOrderId },
          });
          expectStatus('payment razorpay create-order', razorpayCreate, [200]);

          const razorpayVerify = await request('POST', '/api/payment/razorpay/verify', {
            token: customerToken,
            body: {
              orderId: paymentOrderId,
              razorpay_order_id: 'simulated_order',
              razorpay_payment_id: `simulated_payment_${runId}`,
              razorpay_signature: 'simulated',
            },
          });
          expectStatus('payment razorpay verify', razorpayVerify, [200]);

          const stripeIntent = await request('POST', '/api/payment/stripe/create-intent', {
            token: customerToken,
            body: { orderId: paymentOrderId },
          });
          expectStatus('payment stripe create-intent', stripeIntent, [200]);

          const stripeConfirm = await request('POST', '/api/payment/stripe/confirm', {
            token: customerToken,
            body: { orderId: paymentOrderId, transactionId: `smoke_stripe_${runId}` },
          });
          expectStatus('payment stripe confirm', stripeConfirm, [200]);


      }
    }
  }

    if (physicalBookId) {
      const physicalOrderResp = await request('POST', '/api/orders', {
        token: customerToken,
        body: {
          items: [{ book: physicalBookId, format: 'physical', quantity: 1 }],
          paymentMethod: 'razorpay',
          currency: 'INR',
          shippingAddress: {
            firstName: 'Smoke',
            lastName: 'Customer',
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            country: 'India',
            postalCode: '560001',
            phone: '+911234567890',
          },
        },
      });

      if (expectStatus('create physical order', physicalOrderResp, [201])) {
        physicalOrderId = physicalOrderResp.json?.data?.order?._id || '';
      }

      if (physicalOrderId) {
        const updateTrackingResp = await request('PUT', `/api/orders/${physicalOrderId}/tracking`, {
          token: adminToken,
          body: {
            carrier: 'FedEx',
            trackingNumber: `SMOKE-${runId}`,
            autoNotify: false,
          },
        });
        expectStatus('admin update tracking', updateTrackingResp, [200]);

        const notifyResp = await request('POST', `/api/orders/${physicalOrderId}/notify-shipping`, {
          token: adminToken,
        });
        expectStatus('admin send shipping notification', notifyResp, [200, 500]);
      }
    }

    const adminDashboard = await request('GET', '/api/admin/dashboard/stats', { token: adminToken });
    expectStatus('admin dashboard stats', adminDashboard, [200]);

    const adminOrders = await request('GET', '/api/admin/orders', { token: adminToken });
    expectStatus('admin orders', adminOrders, [200]);

    const adminCustomers = await request('GET', '/api/admin/customers', { token: adminToken });
    expectStatus('admin customers', adminCustomers, [200]);

    if (customerId) {
      const adminCustomerById = await request('GET', `/api/admin/customers/${customerId}`, {
        token: adminToken,
      });
      expectStatus('admin customer by id', adminCustomerById, [200]);

      const adminCustomerReading = await request('GET', `/api/admin/customers/${customerId}/reading`, {
        token: adminToken,
      });
      expectStatus('admin customer reading', adminCustomerReading, [200]);
    } else {
      blocked('admin customer by id', 'Customer id unavailable from auth response');
      blocked('admin customer reading', 'Customer id unavailable from auth response');
    }

    const adminAnalytics = await request('GET', '/api/admin/analytics', { token: adminToken });
    expectStatus('admin analytics', adminAnalytics, [200]);

    const adminReadingAnalytics = await request('GET', '/api/admin/reading-analytics', {
      token: adminToken,
    });
    expectStatus('admin reading analytics', adminReadingAnalytics, [200]);

    const settingsGetResp = await request('GET', '/api/settings', { token: adminToken });
    if (expectStatus('settings get (admin)', settingsGetResp, [200])) {
      originalSettings =
        settingsGetResp.json?.data?.settings || settingsGetResp.json?.data || null;
    }

    if (originalSettings) {
      const nextSettings = normalizeSettingsPayload({
        ...originalSettings,
        siteName: `${originalSettings.siteName || 'PS White'} Smoke`,
      });

      const settingsUpdateResp = await request('PUT', '/api/settings', {
        token: adminToken,
        body: nextSettings,
      });
      expectStatus('settings update (admin)', settingsUpdateResp, [200]);

      const settingsVerifyResp = await request('GET', '/api/settings', { token: adminToken });
      expectStatus('settings verify (admin)', settingsVerifyResp, [200]);

      const revertSettingsResp = await request('PUT', '/api/settings', {
        token: adminToken,
        body: normalizeSettingsPayload(originalSettings),
      });
      expectStatus('settings revert (admin)', revertSettingsResp, [200]);
    }

    const adminBlogList = await request('GET', '/api/blog/admin/posts', { token: adminToken });
    expectStatus('admin blog list', adminBlogList, [200]);

    const createBlogResp = await request('POST', '/api/blog/posts', {
      token: adminToken,
      body: {
        title: `Smoke Blog ${runId}`,
        excerpt: 'Automated smoke excerpt',
        content: `Automated smoke content ${runId}`,
        category: 'General',
        published: false,
        commentsEnabled: true,
      },
    });
    if (expectStatus('admin create blog post', createBlogResp, [201])) {
      adminPostId = createBlogResp.json?.data?.post?._id || '';
    }

    if (adminPostId) {
      const updateBlogResp = await request('PUT', `/api/blog/posts/${adminPostId}`, {
        token: adminToken,
        body: {
          title: `Smoke Blog ${runId} Updated`,
          excerpt: 'Updated excerpt',
          content: `Updated smoke content ${runId}`,
          category: 'General',
          published: true,
          commentsEnabled: true,
        },
      });
      expectStatus('admin update blog post', updateBlogResp, [200]);

      const deleteBlogResp = await request('DELETE', `/api/blog/posts/${adminPostId}`, {
        token: adminToken,
      });
      expectStatus('admin delete blog post', deleteBlogResp, [200]);
    }

    const newsletterEmail = `smoke_news_${runId}@example.com`;
    const subscribeResp = await request('POST', '/api/newsletter/subscribe', {
      body: { email: newsletterEmail },
    });
    expectStatus('newsletter subscribe', subscribeResp, [200, 201]);

    const unsubscribeResp = await request('POST', '/api/newsletter/unsubscribe', {
      body: { email: newsletterEmail },
    });
    expectStatus('newsletter unsubscribe', unsubscribeResp, [200]);

    const newsletterAdminList = await request('GET', '/api/newsletter', { token: adminToken });
    expectStatus('newsletter admin list', newsletterAdminList, [200]);

    const newsletterStatsResp = await request('GET', '/api/newsletter/stats', { token: adminToken });
    expectStatus('newsletter admin stats', newsletterStatsResp, [200]);

    const quotesToday = await request('GET', '/api/quotes/today');
    expectStatus('quotes today', quotesToday, [200]);

    const quotesStats = await request('GET', '/api/quotes/stats', { token: adminToken });
    expectStatus('quotes stats (admin)', quotesStats, [200]);

    const quotesList = await request('GET', '/api/quotes', { token: adminToken });
    expectStatus('quotes list (admin)', quotesList, [200]);

    const now = new Date();
    const startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const createQuoteResp = await request('POST', '/api/quotes', {
      token: adminToken,
      body: {
        text: `Smoke quote ${runId}`,
        author: 'Smoke Tester',
        category: 'general',
        startDate,
        endDate,
        active: true,
      },
    });
    if (expectStatus('create quote (admin)', createQuoteResp, [201])) {
      adminQuoteId = createQuoteResp.json?.data?._id || '';
    }

    if (adminQuoteId) {
      const updateQuoteResp = await request('PUT', `/api/quotes/${adminQuoteId}`, {
        token: adminToken,
        body: {
          text: `Smoke quote ${runId} updated`,
        },
      });
      expectStatus('update quote (admin)', updateQuoteResp, [200]);

      const deleteQuoteResp = await request('DELETE', `/api/quotes/${adminQuoteId}`, {
        token: adminToken,
      });
      expectStatus('delete quote (admin)', deleteQuoteResp, [200]);
    }

    const routeGuards = [
      ['settings guard', 'GET', '/api/settings'],
      ['orders all guard', 'GET', '/api/orders/all'],
      ['reviews admin guard', 'GET', '/api/reviews/admin'],
      ['blog admin guard', 'GET', '/api/blog/admin/posts'],
      ['newsletter stats guard', 'GET', '/api/newsletter/stats'],
    ];

    for (const [name, method, endpoint] of routeGuards) {
      const resp = await request(method, endpoint);
      expectStatus(name, resp, [401]);
    }

    const trackingGuardResp = await request(
      'PUT',
      '/api/orders/69c034be8161e08683c8940a/tracking',
      {
        body: {
          carrier: 'FedEx',
          trackingNumber: 'SMOKE',
        },
      }
    );
    expectStatus('order tracking guard route', trackingGuardResp, [401]);

    const missingApiPrefixResp = await request(
      'PUT',
      '/orders/69c034be8161e08683c8940a/tracking',
      {
        body: {
          carrier: 'FedEx',
          trackingNumber: 'SMOKE',
        },
      }
    );
    expectStatus('order tracking missing /api prefix', missingApiPrefixResp, [404]);
  } catch (error) {
    fail('deep smoke runtime', error.message || String(error));
  } finally {
    summarize();
  }
};

run();
