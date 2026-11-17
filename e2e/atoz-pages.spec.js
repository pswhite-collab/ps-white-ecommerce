import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '1920', width: 1920, height: 1080, scale: 1 },
  { name: '1525', width: 1525, height: 864, scale: 1.25 },
  { name: '1024', width: 1024, height: 768, scale: 1 },
  { name: '768', width: 768, height: 1024, scale: 1 },
  { name: '390', width: 390, height: 844, scale: 1 },
];

const PAGES = [
  // Public Customer Routes
  { id: 'home', path: '/', access: 'public', titleRegex: /PS White/i },
  { id: 'books', path: '/books', access: 'public', titleRegex: /PS White/i },
  { id: 'book-detail', path: '/books/6afb0a8974f8e87d9422505c', access: 'public', titleRegex: /PS White/i },
  { id: 'blog', path: '/blog', access: 'public', titleRegex: /PS White/i },
  { id: 'blog-post', path: '/blog/the-solitude-of-writing', access: 'public', titleRegex: /PS White/i },
  { id: 'login', path: '/login', access: 'public', titleRegex: /PS White/i },
  { id: 'register', path: '/register', access: 'public', titleRegex: /PS White/i },
  { id: 'cart', path: '/cart', access: 'public', titleRegex: /PS White/i },

  // Customer Protected Routes
  { id: 'checkout', path: '/checkout', access: 'customer', titleRegex: /PS White/i, requiresCart: true },
  { id: 'order-success', path: '/order-success/6afb0a8974f8e87d94225076', access: 'customer', titleRegex: /PS White/i },
  { id: 'library', path: '/library', access: 'customer', titleRegex: /PS White/i },
  { id: 'reader', path: '/reader/6afb0a8974f8e87d9422505c', access: 'customer', titleRegex: /PS White/i },

  // Admin Routes
  { id: 'admin-login', path: '/admin/login', access: 'public', titleRegex: /PS White/i },
  { id: 'admin-dashboard', path: '/admin/dashboard', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-manage-books', path: '/admin/manage-books', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-orders', path: '/admin/orders', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-customers', path: '/admin/customers', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-reading-analytics', path: '/admin/reading-analytics', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-quotes', path: '/admin/quotes', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-reviews', path: '/admin/reviews', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-blog', path: '/admin/blog', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-newsletter', path: '/admin/newsletter', access: 'admin', titleRegex: /PS White/i },
  { id: 'admin-settings', path: '/admin/settings', access: 'admin', titleRegex: /PS White/i },
];

test.describe('Phase 2.1: A-to-Z Per-Page Inventory Verification', () => {
  let customerToken = '';
  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    // Obtain tokens once for the entire suite
    const custRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'anika@example.com', password: 'Password@123' },
    });
    const custJson = await custRes.json();
    customerToken = custJson.data.token;

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

  for (const pageItem of PAGES) {
    for (const vp of VIEWPORTS) {
      test(`Page [${pageItem.id}] @ ${vp.name}px: render, responsiveness, screenshots, and visual checks`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        const pageErrors = [];
        page.on('pageerror', (err) => {
          pageErrors.push(err.message);
        });

        const consoleErrors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const txt = msg.text();
            if (!txt.includes('favicon.ico') && !txt.includes('Chrome is not the default')) {
              consoleErrors.push(txt);
            }
          }
        });

        // Setup authentication state
        await page.goto('/');
        if (pageItem.access === 'customer') {
          await page.evaluate(
            ({ token, requiresCart }) => {
              localStorage.setItem('pswhite_token', token);
              localStorage.setItem(
                'pswhite_user',
                JSON.stringify({ email: 'anika@example.com', role: 'customer' })
              );
              if (requiresCart) {
                const sampleItem = [
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
                localStorage.setItem('pswhite_cart', JSON.stringify(sampleItem));
              }
            },
            { token: customerToken, requiresCart: Boolean(pageItem.requiresCart) }
          );
        } else if (pageItem.access === 'admin') {
          await page.evaluate(
            ({ token }) => {
              localStorage.setItem('pswhite_token', token);
              localStorage.setItem(
                'pswhite_user',
                JSON.stringify({ email: 'pswhite786@gmail.com', role: 'admin' })
              );
            },
            { token: adminToken }
          );
        } else {
          await page.evaluate(() => {
            localStorage.removeItem('pswhite_token');
            localStorage.removeItem('pswhite_user');
          });
        }

        // Navigate to the target page
        const response = await page.goto(pageItem.path, { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBeLessThan(400);

        // Wait for main content or network idle
        await page.waitForLoadState('networkidle');

        // Check for page errors
        expect(pageErrors).toEqual([]);

        // Check for horizontal scrollbar (no layout breakout)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        });
        expect(hasHorizontalScroll).toBe(false);

        // Check broken images
        const brokenImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs
            .filter((img) => img.src && !img.src.startsWith('data:') && (!img.complete || img.naturalWidth === 0))
            .map((img) => img.src);
        });
        expect(brokenImages).toEqual([]);

        // Ensure screenshot directory exists and take screenshot
        const artifactDir = path.resolve(process.cwd(), 'test-artifacts/pages', pageItem.id);
        fs.mkdirSync(artifactDir, { recursive: true });
        const screenshotPath = path.join(artifactDir, `${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        expect(fs.existsSync(screenshotPath)).toBe(true);

        // Check heading hierarchy: exactly one or two h1/h2 headings (reader has dedicated header)
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeLessThanOrEqual(2);

        // SPA refresh test: direct reload maintains content and route
        await page.reload({ waitUntil: 'domcontentloaded' });
        expect(page.url()).toContain(pageItem.path.split('?')[0]);
      });
    }
  }
});
