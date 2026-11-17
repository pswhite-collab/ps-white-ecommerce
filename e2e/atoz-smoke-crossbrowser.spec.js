import { test, expect } from '@playwright/test';

test.describe('Phase 2 Smoke: Cross-Browser Core Flows (Chromium, Firefox, WebKit)', () => {
  test('Smoke: Guest browses homepage and catalog smoothly', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/PS White/i);

    // Header logo visible
    const logo = page.locator('header a[href="/"]');
    await expect(logo).toBeVisible();

    // 2. Visit catalog
    await page.goto('/books');
    await expect(page).toHaveURL(/\/books/);
    const bookCards = page.locator('article, .book-card, a[href^="/books/"]');
    await expect(bookCards.first()).toBeVisible({ timeout: 15000 });

    // 3. Visit blog
    await page.goto('/blog');
    await expect(page).toHaveURL(/\/blog/);
    await expect(page.locator('h1')).toHaveText(/Blog/i);

    // 4. Cart page loads empty without error
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('h1')).toHaveText(/Cart/i);
  });
});
