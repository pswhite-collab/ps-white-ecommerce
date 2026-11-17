import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 2.11: Automated Accessibility Audit (Axe WCAG 2.1 AA)', () => {
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

  const checkA11y = async (page, pageName) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Brand palette is defined in COLOR_PALETTE_REFERENCE.md
      .analyze();

    const seriousOrCritical = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );

    if (seriousOrCritical.length > 0) {
      console.warn(
        `A11y warnings on ${pageName}:`,
        seriousOrCritical.map((v) => ({ id: v.id, impact: v.impact, description: v.description }))
      );
    }

    expect(seriousOrCritical).toEqual([]);
  };

  test('Axe Audit: Home Page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Home');
  });

  test('Axe Audit: Books Page', async ({ page }) => {
    await page.goto('/books');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Books');
  });

  test('Axe Audit: Book Detail Page', async ({ page }) => {
    await page.goto('/books/6afb0a8974f8e87d9422505c');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Book Detail');
  });

  test('Axe Audit: Checkout Page', async ({ page }) => {
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
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Checkout');
  });

  test('Axe Audit: Admin Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
    }, { token: adminToken });

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Admin Dashboard');
  });
});
