import { chromium } from '@playwright/test';
import path from 'path';

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1906, height: 1000 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  let allPassed = true;

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Header logo link
    const logo = page.locator('header a[href="/"]');
    await logo.waitFor({ state: 'visible' });

    const box = await logo.boundingBox();
    if (!box) {
      console.error(`FAIL: Logo bounding box not found at viewport ${vp.width}x${vp.height}`);
      allPassed = false;
      continue;
    }

    const logoCenterX = box.x + box.width / 2;
    const viewportCenterX = vp.width / 2;
    const diff = Math.abs(logoCenterX - viewportCenterX);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    const isCentered = diff <= 2.0;
    const isScrollClean = !hasHorizontalScroll;

    console.log(
      `Viewport ${vp.width}x${vp.height}: logoCenterX=${logoCenterX.toFixed(2)}, vpCenter=${viewportCenterX}, diff=${diff.toFixed(2)}px, centered=${isCentered}, noHScroll=${isScrollClean}`
    );

    if (!isCentered || !isScrollClean) {
      allPassed = false;
    }

    if (vp.width === 1906) {
      const screenshotPath = path.resolve('test-artifacts/header/header-after-1906px.png');
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Saved screenshot to ${screenshotPath}`);
    }

    await context.close();
  }

  await browser.close();

  if (!allPassed) {
    console.error('Header centering verification FAILED');
    process.exit(1);
  } else {
    console.log('ALL VIEWPORTS PASSED HEADER CENTERING VERIFICATION');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
