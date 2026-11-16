import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const viewports = [
  { width: 1920, height: 1080, name: '1920px' },
  { width: 1906, height: 1080, name: '1906px' },
  { width: 1440, height: 900, name: '1440px' },
  { width: 1024, height: 768, name: '1024px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 390, height: 844, name: '390px' },
];

test.describe('Journey 8: Responsive Header & Exact Logo Centering', () => {
  test.beforeAll(() => {
    const dir = path.resolve('test-artifacts/header');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  for (const vp of viewports) {
    test(`Header logo is mathematically centered (within 2px) at ${vp.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const header = page.getByRole('banner');
      await expect(header).toBeVisible();

      const logoLink = header.locator('a[href="/"]');
      await expect(logoLink).toBeVisible();

      const logoBox = await logoLink.boundingBox();
      expect(logoBox).not.toBeNull();

      const logoCenter = logoBox.x + logoBox.width / 2;
      const expectedCenter = vp.width / 2;
      const delta = Math.abs(logoCenter - expectedCenter);

      // Must be centered within +/- 2 pixels across all viewports
      expect(delta).toBeLessThanOrEqual(2);

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width + 1);

      // Capture screenshot for target 1906px and 390px
      if (vp.width === 1906 || vp.width === 390) {
        await page.screenshot({
          path: `test-artifacts/header/header-after-${vp.width}px.png`,
          clip: { x: 0, y: 0, width: vp.width, height: 120 },
        });
      }
    });
  }

  test('Mobile hamburger menu toggles smoothly on 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const hamburger = page.locator('header button[aria-label="Toggle mobile menu"]');
    await expect(hamburger).toBeVisible();

    // Open mobile menu
    await hamburger.click();
    const mobileLink = page.locator('header div.md\\:hidden').getByRole('link', { name: /books/i });
    await expect(mobileLink).toBeVisible();

    // Close mobile menu
    await hamburger.click();
    await expect(mobileLink).not.toBeVisible();
  });
});
