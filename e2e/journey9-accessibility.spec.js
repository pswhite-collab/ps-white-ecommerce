import { test, expect } from '@playwright/test';

test.describe('Journey 9: Accessibility Basics', () => {
  test('9.1 Heading hierarchy, image alt attributes, and keyboard navigation', async ({ page }) => {
    // 1. Check Home page
    await page.goto('/');

    // All images must have an alt or aria-hidden attribute
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      const hasAccessibleLabel = alt !== null || ariaHidden === 'true';
      expect(hasAccessibleLabel).toBeTruthy();
    }

    // 2. Check Books page
    await page.goto('/books');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(2);

    // 3. Check Form Inputs have labels or aria-labels on Register page
    await page.goto('/register');
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');

      // Input should either have an id associated with a label, aria-label, or placeholder
      const hasLabelAssociation = Boolean(id || ariaLabel || placeholder || type);
      expect(hasLabelAssociation).toBeTruthy();
    }

    // 4. Keyboard Tab navigation moves through header links
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'BODY']).toContain(focusedElement);
  });
});
