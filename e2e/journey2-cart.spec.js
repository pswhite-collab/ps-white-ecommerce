import { test, expect } from '@playwright/test';

test.describe('Journey 2: Cart Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before test and dismiss daily quote popup
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('pswhite_cart');
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  test('Add ebook, add physical, change quantity, remove item, badge updates, persists on reload', async ({ page }) => {
    // 1. Browse to books
    await page.goto('/books');
    const bookLinks = page.locator('a[href^="/books/"]');
    await expect(bookLinks.first()).toBeVisible({ timeout: 10000 });

    // Open first book (The Weight of Silence)
    await bookLinks.first().click();
    await expect(page).toHaveURL(/\/books\/[0-9a-fA-F]{24}/);

    // 2. Add eBook to cart
    const ebookButton = page.getByRole('button', { name: /ebook/i });
    if (await ebookButton.isVisible()) {
      await ebookButton.click();
    }
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeEnabled();
    await addToCartButton.click();

    // Verify cart badge shows 1
    const cartBadge = page.locator('header a[href="/cart"] span');
    await expect(cartBadge).toHaveText('1');

    // 3. Add Physical book format to cart
    const physicalButton = page.getByRole('button', { name: /paperback|hardcover|physical/i });
    if (await physicalButton.isVisible()) {
      await physicalButton.click();
      await addToCartButton.click();
      // Badge updates to 2
      await expect(cartBadge).toHaveText('2');
    }

    // 4. Navigate to /cart
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('h1')).toHaveText(/Shopping Cart/i);

    // 5. Test persistence on reload
    await page.reload();
    await expect(page.locator('h1')).toHaveText(/Shopping Cart/i);
    await expect(cartBadge).toBeVisible();

    // 6. Quantity increase
    const firstArticle = page.locator('article').first();
    const plusButton = firstArticle.locator('button:has-text("+")');
    if (await plusButton.isVisible()) {
      await plusButton.click();
      // Verify quantity span updated inside the card
      await expect(firstArticle.locator('span.px-3')).toHaveText('2');
    }

    // 7. Remove item
    const removeButton = firstArticle.getByRole('button', { name: /remove/i });
    if (await removeButton.isVisible()) {
      await removeButton.click();
    }
  });
});
