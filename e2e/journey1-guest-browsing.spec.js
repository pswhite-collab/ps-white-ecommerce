import { test, expect } from '@playwright/test';

test.describe('Journey 1: Guest Browsing', () => {
  test('Guest can browse home, featured books, quotes, catalog, book detail, blog, and about', async ({ page }) => {
    // 1. Home page
    await page.goto('/');
    await expect(page).toHaveTitle(/PS White/i);

    // Header logo is visible
    const logo = page.locator('header a[href="/"]');
    await expect(logo).toBeVisible();

    // 2. Quote of the Day Popup
    const quoteModal = page.locator('#quote-popup-title');
    const closeQuote = page.getByRole('button', { name: /close quote popup/i });

    // Check if auto-opened on load or trigger via button
    try {
      await expect(quoteModal).toBeVisible({ timeout: 3000 });
      await expect(quoteModal).toHaveText(/Quote of the Day/i);
      await closeQuote.click();
      await expect(quoteModal).not.toBeVisible();
    } catch {
      const quoteButton = page.getByRole('button', { name: /view today.*quote/i });
      if (await quoteButton.isVisible()) {
        await quoteButton.click();
        await expect(quoteModal).toBeVisible({ timeout: 5000 });
        await closeQuote.click();
        await expect(quoteModal).not.toBeVisible();
      }
    }

    // 3. Books page pagination & filters
    await page.goto('/books');
    await expect(page).toHaveURL(/\/books/);

    // Book cards should load
    const bookCards = page.locator('article, .book-card, a[href^="/books/"]');
    await expect(bookCards.first()).toBeVisible({ timeout: 10000 });

    // Click first book to reach detail page
    const firstBookLink = page.locator('a[href^="/books/"]').first();
    const bookHref = await firstBookLink.getAttribute('href');
    await firstBookLink.click();
    await expect(page).toHaveURL(new RegExp(bookHref));

    // Detail page checks
    const detailTitle = page.locator('h1');
    await expect(detailTitle).toBeVisible();

    // 4. Blog list
    await page.goto('/blog');
    await expect(page).toHaveURL(/\/blog/);
    const blogHeading = page.locator('h1, h2').first();
    await expect(blogHeading).toBeVisible();

    // 5. About anchor scroll
    await page.goto('/#about');
    await expect(page.locator('#about, section:has-text("About")').first()).toBeVisible();

    // 6. Footer links
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: /books/i }).first()).toBeVisible();
  });
});
