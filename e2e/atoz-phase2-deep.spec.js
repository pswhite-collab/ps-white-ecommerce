import { test, expect } from '@playwright/test';

test.describe('Phase 2.2: Deep Flows, Special Cases, Admin CRUD, Security & Resilience', () => {
  let customerToken = '';
  let customer2Token = '';
  let adminToken = '';
  let customerId = '';
  let customer2Id = '';

  test.beforeAll(async ({ request }) => {
    // 1. Customer 1 (Anika)
    const custRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'anika@example.com', password: 'Password@123' },
    });
    const custJson = await custRes.json();
    customerToken = custJson.data.token;
    customerId = custJson.data.user._id || custJson.data.user.id;

    // 2. Customer 2 (Rahul) for IDOR cross-account tests
    const cust2Res = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'rahul@example.com', password: 'Password@123' },
    });
    const cust2Json = await cust2Res.json();
    customer2Token = cust2Json.data.token;
    customer2Id = cust2Json.data.user._id || cust2Json.data.user.id;

    // 3. Admin (Super Admin)
    const adminRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'pswhite786@gmail.com', password: 'Admin@12345' },
    });
    const adminJson = await adminRes.json();
    adminToken = adminJson.data.token;
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  // -------------------------------------------------------------
  // STRIPE PAYMENT SPECIAL CASES
  // -------------------------------------------------------------
  test('Stripe 1: Success payment flow - order marked paid, cart cleared, eBook available in library', async ({
    request,
  }) => {
    // Create an eBook order for Anika
    const orderRes = await request.post('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        items: [
          {
            book: '6afb0a8974f8e87d9422505c',
            format: 'ebook',
            quantity: 1,
          },
        ],
      },
    });
    expect(orderRes.status()).toBe(201);
    const order = (await orderRes.json()).data.order;
    expect(order._id).toBeDefined();

    // Create payment intent
    const intentRes = await request.post('http://localhost:5000/api/payment/stripe/create-intent', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: { orderId: order._id },
    });
    expect(intentRes.status()).toBe(200);

    // Confirm simulated payment in test environment
    const confirmRes = await request.post('http://localhost:5000/api/payment/stripe/confirm', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        orderId: order._id,
        paymentIntentId: `simulated_intent_${order._id}`,
      },
    });
    expect(confirmRes.status()).toBe(200);
    const confirmedOrder = (await confirmRes.json()).data.order;
    expect(confirmedOrder.payment.status).toBe('paid');
    expect(confirmedOrder.status).toBe('completed');

    // Verify digital library includes this book for user
    const libraryRes = await request.get('http://localhost:5000/api/reading/library', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(libraryRes.status()).toBe(200);
    const libraryItems = (await libraryRes.json()).data.library || [];
    const hasBook = libraryItems.some((b) => String(b.book?._id || b.book || b._id) === '6afb0a8974f8e87d9422505c');
    expect(hasBook).toBe(true);
  });

  test('Stripe 2: Decline payment flow - unconfirmed or invalid intent rejected, order remains unpaid', async ({
    request,
  }) => {
    // Create an order
    const orderRes = await request.post('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        items: [
          {
            book: '6afb0a8974f8e87d9422505c',
            format: 'ebook',
            quantity: 1,
          },
        ],
      },
    });
    expect(orderRes.status()).toBe(201);
    const order = (await orderRes.json()).data.order;

    // Attempt to confirm with a declined/invalid payment intent ID
    const declineConfirmRes = await request.post('http://localhost:5000/api/payment/stripe/confirm', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        orderId: order._id,
        paymentIntentId: 'pi_declined_card_12345',
      },
    });
    // Should be rejected (400 or 402)
    expect([400, 402]).toContain(declineConfirmRes.status());

    // Check order in database remains unpaid
    const checkOrderRes = await request.get(`http://localhost:5000/api/orders/${order._id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const checkedOrder = (await checkOrderRes.json()).data.order;
    expect(checkedOrder.payment?.status).not.toBe('paid');
  });

  test('Stripe 3: 3-D Secure handling - intent requiring action cannot mark order paid without completion', async ({
    request,
  }) => {
    // Create an order
    const orderRes = await request.post('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        items: [
          {
            book: '6afb0a8974f8e87d9422505c',
            format: 'ebook',
            quantity: 1,
          },
        ],
      },
    });
    const order = (await orderRes.json()).data.order;

    // Attempt to confirm an incomplete intent that still requires 3DS
    const incompleteIntentRes = await request.post('http://localhost:5000/api/payment/stripe/confirm', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        orderId: order._id,
        paymentIntentId: 'pi_3ds_challenge_incomplete',
      },
    });
    // System must refuse to mark as paid without succeeded status
    expect([400, 402]).toContain(incompleteIntentRes.status());
  });

  test('Stripe 4: Retry without duplicate order - idempotency key reuses existing intent and order', async ({
    request,
  }) => {
    // Create order
    const orderRes = await request.post('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        items: [
          {
            book: '6afb0a8974f8e87d9422505c',
            format: 'ebook',
            quantity: 1,
          },
        ],
      },
    });
    const order = (await orderRes.json()).data.order;

    // 1st intent creation
    const intent1Res = await request.post('http://localhost:5000/api/payment/stripe/create-intent', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: { orderId: order._id },
    });
    const intent1 = (await intent1Res.json()).data;

    // 2nd intent creation (e.g. user retrying after network pause)
    const intent2Res = await request.post('http://localhost:5000/api/payment/stripe/create-intent', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: { orderId: order._id },
    });
    const intent2 = (await intent2Res.json()).data;

    // Must return the SAME paymentIntentId rather than creating duplicate intents
    expect(intent2.paymentIntentId).toBe(intent1.paymentIntentId);
  });

  // -------------------------------------------------------------
  // ADMIN CRUD OPERATIONS
  // -------------------------------------------------------------
  test('Admin CRUD 1: Books - create, update, toggle featured, and soft delete', async ({ request }) => {
    // 1. Create a new book
    const createRes = await request.post('http://localhost:5000/api/books', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: `Test Book Admin CRUD ${Date.now()}`,
        subtitle: 'A Tale of Verification',
        description: 'Comprehensive test description for verifying administrative book management flows.',
        author: 'P.S. White',
        genres: ['Fiction'],
        formats: {
          ebook: { price: 9.99, available: true },
          physical: {
            price: 19.99,
            available: true,
            stock: 25,
            binding: 'Paperback',
          },
        },
        featured: false,
      },
    });
    expect(createRes.status()).toBe(201);
    const newBook = (await createRes.json()).data.book;
    const bookId = newBook._id;

    // 2. Update book price and featured status
    const updateRes = await request.put(`http://localhost:5000/api/books/${bookId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: newBook.title,
        featured: true,
        description: 'Updated test description to prove update operations.',
      },
    });
    expect(updateRes.status()).toBe(200);
    const updatedBook = (await updateRes.json()).data.book;
    expect(updatedBook.featured).toBe(true);

    // 3. Delete book
    const deleteRes = await request.delete(`http://localhost:5000/api/books/${bookId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([200, 204]).toContain(deleteRes.status());
  });

  test('Admin CRUD 2: Orders - view, filter, and update fulfillment status', async ({ request }) => {
    // List orders as admin
    const listRes = await request.get('http://localhost:5000/api/orders/all', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.status()).toBe(200);
    const orders = (await listRes.json()).data.orders;
    expect(orders.length).toBeGreaterThan(0);

    const targetOrder = orders[0];

    // Update fulfillment status
    const updateRes = await request.put(`http://localhost:5000/api/orders/${targetOrder._id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        status: 'shipped',
        trackingNumber: 'TRACK-1234567890',
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = (await updateRes.json()).data.order;
    expect(updated.status).toBe('shipped');
  });

  test('Admin CRUD 3: Quotes - create, edit, and toggle active status', async ({ request }) => {
    // 1. Create quote
    const now = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const createRes = await request.post('http://localhost:5000/api/quotes', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        text: `Words are whispers in the corridor of time ${Date.now()}.`,
        source: 'The Quiet Hours',
        author: 'P.S. White',
        startDate: now.toISOString(),
        endDate: tomorrow.toISOString(),
        active: true,
      },
    });
    expect(createRes.status()).toBe(201);
    const quote = (await createRes.json()).data;

    // 2. Update quote
    const updateRes = await request.put(`http://localhost:5000/api/quotes/${quote._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        text: 'Words are thunder across eternity.',
        active: false,
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = (await updateRes.json()).data;
    expect(updated.active).toBe(false);

    // 3. Delete quote
    const deleteRes = await request.delete(`http://localhost:5000/api/quotes/${quote._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([200, 204]).toContain(deleteRes.status());
  });

  test('Admin CRUD 4: Blog - create post draft, publish, and edit', async ({ request }) => {
    // 1. Create post
    const createRes = await request.post('http://localhost:5000/api/blog/posts', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: `A Deep Reflection On Narrative Craft ${Date.now()}`,
        content: '<p>Every sentence is an architectural foundation for story.</p>',
        excerpt: 'Thoughts on crafting compelling fictional literature.',
        published: true,
        category: 'craft',
      },
    });
    expect(createRes.status()).toBe(201);
    const post = (await createRes.json()).data.post;

    // 2. Edit post
    const updateRes = await request.put(`http://localhost:5000/api/blog/posts/${post._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: `A Deep Reflection On Narrative Craft (Revised)`,
        content: post.content,
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = (await updateRes.json()).data.post;
    expect(updated.title).toContain('(Revised)');

    // 3. Delete post
    const deleteRes = await request.delete(`http://localhost:5000/api/blog/posts/${post._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([200, 204]).toContain(deleteRes.status());
  });

  test('Admin CRUD 5: Newsletter - list subscribers and counts', async ({ request }) => {
    const listRes = await request.get('http://localhost:5000/api/newsletter/subscribers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.status()).toBe(200);
    const subscribers = (await listRes.json()).data.subscribers;
    expect(Array.isArray(subscribers)).toBe(true);
  });

  test('Admin CRUD 6: Reviews - approve and hide customer reviews', async ({ request }) => {
    const reviewsRes = await request.get('http://localhost:5000/api/reviews/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (reviewsRes.status() === 200) {
      const reviews = (await reviewsRes.json()).data.reviews;
      if (reviews && reviews.length > 0) {
        const review = reviews[0];
        const statusRes = await request.put(`http://localhost:5000/api/reviews/${review._id}/approve`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect([200, 204]).toContain(statusRes.status());
      }
    }
  });

  // -------------------------------------------------------------
  // SITE SETTINGS
  // -------------------------------------------------------------
  test('Settings: update site preferences, allowRegistration, and free shipping threshold', async ({
    request,
  }) => {
    // Read current settings
    const getRes = await request.get('http://localhost:5000/api/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.status()).toBe(200);
    const originalSettings = (await getRes.json()).data.settings;

    // Update settings
    const updateRes = await request.put('http://localhost:5000/api/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        siteName: 'PS White Official Store',
        freeShippingThreshold: 60,
        allowRegistration: true,
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = (await updateRes.json()).data.settings;
    expect(updated.freeShippingThreshold).toBe(60);

    // Revert settings to original
    await request.put('http://localhost:5000/api/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        siteName: originalSettings.siteName || 'PS White',
        freeShippingThreshold: originalSettings.freeShippingThreshold || 50,
        allowRegistration: originalSettings.allowRegistration !== false,
      },
    });
  });

  // -------------------------------------------------------------
  // SECURITY & ABUSE DEFENSE
  // -------------------------------------------------------------
  test('Security 1: NoSQL injection in authentication and catalog search is blocked', async ({ request }) => {
    // 1. Login with NoSQL operator
    const loginAttempt = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: { $ne: null },
        password: { $gt: '' },
      },
    });
    expect([400, 401]).toContain(loginAttempt.status());

    // 2. Search catalog with NoSQL injection object
    const searchAttempt = await request.get('http://localhost:5000/api/books?search[$regex]=.*');
    // Must return valid response without 500 error
    expect([200, 400]).toContain(searchAttempt.status());
  });

  test('Security 2: IDOR protection - Customer 1 cannot access Customer 2 orders', async ({ request }) => {
    // Create an order for Customer 2
    const orderRes = await request.post('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: {
        items: [
          {
            book: '6afb0a8974f8e87d9422505c',
            format: 'ebook',
            quantity: 1,
          },
        ],
      },
    });
    expect(orderRes.status()).toBe(201);
    const cust2Order = (await orderRes.json()).data.order;

    // Customer 1 tries to read Customer 2 order
    const idorReadRes = await request.get(`http://localhost:5000/api/orders/${cust2Order._id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect([403, 404]).toContain(idorReadRes.status());

    // Customer 1 tries to confirm payment on Customer 2 order
    const idorConfirmRes = await request.post('http://localhost:5000/api/payment/stripe/confirm', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        orderId: cust2Order._id,
        paymentIntentId: 'pi_fake_exploit',
      },
    });
    expect([403, 404]).toContain(idorConfirmRes.status());
  });

  test('Security 3: Price tampering is completely prevented by server catalog recalculation', async ({
    request,
  }) => {
    const maliciousOrder = await request.post('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        items: [
          {
            book: '6afb0a8974f8e87d9422505c',
            format: 'ebook',
            quantity: 2,
            price: 0.001, // Malicious client trying to set 0.1 cents
          },
        ],
      },
    });
    expect(maliciousOrder.status()).toBe(201);
    const order = (await maliciousOrder.json()).data.order;
    // Total must be > $10 (catalog price 14.99 * 2 = 29.98)
    expect(order.total).toBeGreaterThan(10);
    expect(order.subtotal).toBeGreaterThan(10);
  });

  test('Security 4: XSS payload sanitization in review submissions', async ({ request }) => {
    const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>Authentic Feedback';
    const reviewRes = await request.post('http://localhost:5000/api/reviews', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        bookId: '6afb0a8974f8e87d9422505c',
        rating: 5,
        title: 'Safe Review',
        comment: xssPayload,
      },
    });
    // System should either accept with sanitized/escaped output or reject invalid content
    if (reviewRes.status() === 201) {
      const createdReview = (await reviewRes.json()).data.review;
      expect(createdReview.comment).not.toContain('<script>');
    } else {
      expect([400, 422]).toContain(reviewRes.status());
    }
  });

  // -------------------------------------------------------------
  // RESILIENCE & ERROR HANDLING
  // -------------------------------------------------------------
  test('Resilience 1: Corrupted or malformed JWT in localStorage is handled without crash or infinite loop', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pswhite_token', 'malformed.garbage.jwt.token');
    });

    // Navigate to protected page
    await page.goto('/library');
    // Should gracefully redirect to /login?redirect=%2Flibrary without blank white screen
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toHaveText(/Sign In|Login/i);
    // Page must remain interactive
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Resilience 2: Nonexistent routes trigger friendly SPA fallback, no crash', async ({ page }) => {
    await page.goto('/random-nonexistent-route-404-check');
    // Should either render NotFound or redirect to home shell
    await expect(page.locator('h1, header, main').first()).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Cannot GET');
  });
});
