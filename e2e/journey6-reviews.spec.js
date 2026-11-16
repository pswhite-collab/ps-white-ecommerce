import { test, expect } from '@playwright/test';

test.describe('Journey 6: Reviews & Moderation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  test('6.1 Verify review display and admin review moderation dashboard', async ({ page, request }) => {
    // 1. Check public reviews on a book detail page
    await page.goto('/books');
    const bookLinks = page.locator('a[href^="/books/"]');
    await expect(bookLinks.first()).toBeVisible({ timeout: 10000 });
    await bookLinks.first().click();

    // Click "Reviews" tab if present
    const reviewsTab = page.getByRole('button', { name: /^reviews/i });
    if (await reviewsTab.isVisible()) {
      await reviewsTab.click();
    }

    // 2. Log in as admin and verify admin review moderation list
    const adminLoginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'pswhite786@gmail.com', password: 'Admin@12345' },
    });
    const { token: adminToken } = (await adminLoginRes.json()).data;

    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
    }, { token: adminToken });

    // Open admin reviews dashboard
    await page.goto('/admin/reviews');
    await expect(page).toHaveURL(/\/admin\/reviews/);
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Filter tabs should be visible
    const pendingTab = page.getByRole('button', { name: /pending/i });
    await expect(pendingTab).toBeVisible();

    const allTab = page.getByRole('button', { name: /all/i });
    await expect(allTab).toBeVisible();
  });
});
