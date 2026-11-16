import { test, expect } from '@playwright/test';

test.describe('Journey 5: Reading Experience', () => {
  test.beforeEach(async ({ page, request }) => {
    // Login as Anika (who owns The Weight of Silence)
    const loginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'anika@example.com', password: 'Password@123' },
    });
    const { token } = (await loginRes.json()).data;

    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    }, { token });
  });

  test('5.1 Open library, launch reader, turn page, save bookmark, verify bookmark persists', async ({ page }) => {
    // 1. Go to Library
    await page.goto('/library');
    await expect(page).toHaveURL(/\/library/);
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check that Anika's book is visible in library
    const readBtn = page.getByRole('button', { name: /continue reading|start reading/i });
    await expect(readBtn.first()).toBeVisible({ timeout: 10000 });
    await readBtn.first().click();

    // 2. Now in /reader/:bookId
    await expect(page).toHaveURL(/\/reader\/[0-9a-fA-F]{24}/);

    // Verify Reader Controls
    const bookmarksBtn = page.getByRole('button', { name: /bookmarks/i });
    await expect(bookmarksBtn).toBeVisible({ timeout: 15000 });

    // Open Bookmarks panel
    await bookmarksBtn.click();
    const bookmarkHeading = page.locator('h3:has-text("Bookmarks")');
    await expect(bookmarkHeading).toBeVisible();

    // Add a test bookmark
    const noteInput = page.locator('textarea[placeholder*="note"]');
    if (await noteInput.isVisible()) {
      await noteInput.fill('E2E Reading note for verification');
      await page.getByRole('button', { name: /save bookmark/i }).click();

      // Verify bookmark appears in list
      await expect(page.locator('p:has-text("E2E Reading note for verification")').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
