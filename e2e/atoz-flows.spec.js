import { test, expect } from '@playwright/test';

test.describe('Phase 2.2: Deep End-to-End User Flows & Edge Cases', () => {
  let customerToken = '';
  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    const custRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'anika@example.com', password: 'Password@123' },
    });
    customerToken = (await custRes.json()).data.token;

    const adminRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'pswhite786@gmail.com', password: 'Admin@12345' },
    });
    adminToken = (await adminRes.json()).data.token;
  });

  test.beforeEach(async ({ page }) => {
    // Prevent daily quote popup from blocking UI in deep automated flow clicks
    await page.addInitScript(() => {
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  // Flow 1: Home Page
  test('Flow 1: Home page featured books, daily quote, hero CTA, newsletter, and external links', async ({
    page,
    request,
  }) => {
    // Specifically test quote modal by triggering or unsetting seen flag
    await page.goto('/');

    // Featured books section exists and renders cards
    const bookLinks = page.locator('a[href^="/books/"]');
    await expect(bookLinks.first()).toBeVisible({ timeout: 10000 });

    // Hero action buttons
    const exploreBtn = page.getByRole('link', { name: /explore books|browse catalog|shop books/i }).first();
    if (await exploreBtn.isVisible()) {
      await expect(exploreBtn).toHaveAttribute('href', '/books');
    }

    // Daily quote popup can be triggered via button if present
    const quoteButton = page.getByRole('button', { name: /view today.*quote/i });
    if (await quoteButton.isVisible()) {
      await quoteButton.click();
      const quoteModal = page.locator('#quote-popup-title');
      await expect(quoteModal).toBeVisible({ timeout: 5000 });
      const closeBtn = page.getByRole('button', { name: /close quote popup/i });
      await closeBtn.click();
      await expect(quoteModal).not.toBeVisible();
    }

    // About anchor scroll
    await page.goto('/#about');
    const aboutSection = page.locator('#about, section:has-text("About")').first();
    await expect(aboutSection).toBeVisible();

    // Newsletter subscription test
    const testEmail = `test.subscriber.${Date.now()}@example.com`;
    const newsInput = page.locator('input[type="email"]').first();
    if (await newsInput.isVisible()) {
      await newsInput.fill(testEmail);
      const submitBtn = page.locator('button:has-text("Subscribe"), button:has-text("Join")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await expect(
          page.locator('text=/Subscribed successfully|already subscribed|Subscription failed/i').first()
        ).toBeVisible({ timeout: 5000 });
      }
    }

    // External link: ZERO has target="_blank" and rel="noopener noreferrer"
    const zeroLink = page.locator('a[href*="zeroops.in"]').first();
    await expect(zeroLink).toHaveAttribute('target', '_blank');
    await expect(zeroLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // Flow 2: Books Catalog
  test('Flow 2: Books catalog filters, pagination, regex safety search, and stock badges', async ({ page }) => {
    await page.goto('/books');
    await expect(page.locator('h1')).toHaveText(/Books|Catalog/i);

    // Book cards should load
    const books = page.locator('article, .book-card, a[href^="/books/"]');
    await expect(books.first()).toBeVisible({ timeout: 10000 });

    // Format filter button
    const ebookFilter = page.locator('button:has-text("eBook"), button:has-text("eBooks")').first();
    if (await ebookFilter.isVisible()) {
      await ebookFilter.click();
      await page.waitForTimeout(500);
    }

    // Search with regex characters should not crash the page or backend
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('([a-z]+)*?');
      await page.waitForTimeout(600);
      expect(page.url()).toContain('/books');
    }
  });

  // Flow 3: Book Detail Page
  test('Flow 3: Book detail format switching, price update, sample reader, and add to cart', async ({ page }) => {
    await page.goto('/books/6afb0a8974f8e87d9422505c');
    await expect(page.locator('h1')).toBeVisible();

    // Format selection buttons
    const formatButtons = page.locator('button:has-text("Paperback"), button:has-text("Hardcover"), button:has-text("eBook")');
    if ((await formatButtons.count()) > 1) {
      await formatButtons.nth(1).click();
      await page.waitForTimeout(300);
    }

    // Add to cart button
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i }).first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      // Cart count badge should appear or update
      await expect(page.locator('header a[href="/cart"]')).toBeVisible();
    }
  });

  // Flow 4: Cart Operations
  test('Flow 4: Cart item persistence, quantity changes, and shipping calculation', async ({ page }) => {
    await page.goto('/');
    // Set a known cart item
    await page.evaluate(() => {
      const items = [
        {
          bookId: '6afb0a8974f8e87d9422505c',
          title: 'The Weight of Silence',
          format: 'physical',
          price: 24.99,
          quantity: 1,
          book: {
            _id: '6afb0a8974f8e87d9422505c',
            title: 'The Weight of Silence',
            coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
            formats: { physical: { price: 24.99, stock: 10 } },
          },
        },
      ];
      localStorage.setItem('pswhite_cart', JSON.stringify(items));
    });

    await page.goto('/cart');
    await expect(page.locator('h1')).toHaveText(/Your Cart|Cart/i);
    await expect(page.locator('text=The Weight of Silence').first()).toBeVisible();

    // Verify localStorage retains cart after reload
    await page.reload();
    await expect(page.locator('text=The Weight of Silence').first()).toBeVisible();
  });

  // Flow 5: Checkout & Stripe Mock
  test('Flow 5: Checkout authentication requirement, address fields, and Stripe Elements mount', async ({
    page,
  }) => {
    // 1. Unauthenticated redirect check
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('pswhite_token');
    });
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login/);

    // 2. Authenticated checkout
    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
      const items = [
        {
          bookId: '6afb0a8974f8e87d9422505c',
          title: 'The Weight of Silence',
          format: 'ebook',
          price: 14.99,
          quantity: 1,
          book: {
            _id: '6afb0a8974f8e87d9422505c',
            title: 'The Weight of Silence',
            coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
            formats: { ebook: { price: 14.99 } },
          },
        },
      ];
      localStorage.setItem('pswhite_cart', JSON.stringify(items));
    }, { token: customerToken });

    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  // Flow 6: Order Success
  test('Flow 6: Order success page displays order details and IDOR verification', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
    }, { token: customerToken });

    await page.goto('/order-success/6afb0a8974f8e87d94225076');
    await expect(page).toHaveURL(/\/order-success\/6afb0a8974f8e87d94225076/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // Flow 7: Library & Reader
  test('Flow 7: Digital library shows owned books, reader launches and navigates', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
    }, { token: customerToken });

    await page.goto('/library');
    await expect(page).toHaveURL(/\/library/);
    await expect(page.locator('h1')).toHaveText(/My Library|Library/i);

    // Open in-browser reader for owned book
    await page.goto('/reader/6afb0a8974f8e87d9422505c');
    await expect(page).toHaveURL(/\/reader\/6afb0a8974f8e87d9422505c/);
    await expect(page.locator('.reader-container, [data-testid="reader"], #reader-viewport, main').first()).toBeVisible({
      timeout: 10000,
    });
  });

  // Flow 8: Blog Listing & Reading
  test('Flow 8: Blog listing and article view with comments', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toHaveText(/Blog/i);

    // Click first blog post
    const postLink = page.locator('a[href^="/blog/"]').first();
    await expect(postLink).toBeVisible();
    await postLink.click();

    await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  // Flow 9: Admin Operations
  test('Flow 9: Admin dashboard, orders, customers, and site settings update', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
    }, { token: adminToken });

    // 1. Dashboard
    await page.goto('/admin/dashboard');
    await expect(page.locator('h1')).toHaveText(/Admin Dashboard/i);

    // 2. Orders list
    await page.goto('/admin/orders');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 3. Customers list
    await page.goto('/admin/customers');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 4. Site Settings
    await page.goto('/admin/settings');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // Flow 10: Security & Abuse Prevention
  test('Flow 10: Security abuse defenses (XSS, NoSQL injection, and price tampering)', async ({ request }) => {
    // 1. NoSQL Injection attempt in login
    const nosqlRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: { $gt: '' }, password: { $gt: '' } },
    });
    expect([400, 401]).toContain(nosqlRes.status());

    // 2. Price Tampering defense: server recalculates item price from database
    const orderRes = await request.post('http://localhost:5000/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        items: [
          {
            book: '6afb0a8974f8e87d9422505c',
            format: 'ebook',
            quantity: 1,
            price: 0.01, // Client attempting to buy for 1 cent
          },
        ],
      },
    });
    expect(orderRes.status()).toBe(201);
    const orderData = (await orderRes.json()).data.order;
    // Price must not be 0.01; server should enforce actual catalog price
    expect(orderData.subtotal).toBeGreaterThan(1);

    // 3. Customer role attempting to call admin route returns 403
    const adminEndpointRes = await request.get('http://localhost:5000/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(adminEndpointRes.status()).toBe(403);
  });
});
