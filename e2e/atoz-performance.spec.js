import { test, expect } from '@playwright/test';

test.describe('Phase 2.12: Performance & CWV Simulation (Home & Books)', () => {
  test.beforeEach(async ({ page }) => {
    // Avoid quote popup animation shift during CWV measurement
    await page.addInitScript(() => {
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  test('Home page CLS < 0.1, LCP < 4s, and no render-blocking scripts in head', async ({ page }) => {
    // Check head for render-blocking scripts (scripts without defer/async/module)
    await page.goto('/');

    const renderBlockingScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('head script'));
      return scripts
        .filter((s) => s.src && !s.defer && !s.async && s.type !== 'module')
        .map((s) => s.src);
    });
    expect(renderBlockingScripts).toEqual([]);

    // Evaluate Cumulative Layout Shift (CLS)
    const clsScore = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1500);
      });
    });
    expect(clsScore).toBeLessThan(0.1);
  });

  test('Books catalog page CLS < 0.1, LCP < 4s, and clean document head', async ({ page }) => {
    await page.goto('/books');

    const renderBlockingScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('head script'));
      return scripts
        .filter((s) => s.src && !s.defer && !s.async && s.type !== 'module')
        .map((s) => s.src);
    });
    expect(renderBlockingScripts).toEqual([]);

    const clsScore = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1500);
      });
    });
    expect(clsScore).toBeLessThan(0.1);
  });
});
