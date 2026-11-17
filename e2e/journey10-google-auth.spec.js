import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Journey 10: Google Sign-In & Authentication Fixes', () => {
  let customerToken;
  let adminToken;

  test.beforeAll(() => {
    customerToken = execSync('node backend/utils/runDevToken.js anika@example.com', { encoding: 'utf-8' }).trim();
    adminToken = execSync('node backend/utils/runDevToken.js pswhite786@gmail.com', { encoding: 'utf-8' }).trim();
  });

  test.beforeEach(async ({ page }) => {
    // Avoid quote popup intercepting clicks
    await page.addInitScript(() => {
      window.localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  test('10.1 Customer OAuth success via URL fragment (#token=) strips token and navigates to /library', async ({ page }) => {
    await page.goto(`/auth/google/success#token=${encodeURIComponent(customerToken)}`);

    // Verify user is redirected to /library
    await page.waitForURL('**/library');
    await expect(page).toHaveURL(/\/library$/);

    // Verify token is completely stripped from visible URL (Defect H)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('token');
    expect(currentUrl).not.toContain('#');

    // Verify session was stored in localStorage
    const storedToken = await page.evaluate(() => localStorage.getItem('pswhite_token'));
    expect(storedToken).toBe(customerToken);
  });

  test('10.2 Admin OAuth success via URL fragment (#token=) strips token and navigates to /admin/dashboard', async ({ page }) => {
    await page.goto(`/admin/login#token=${encodeURIComponent(adminToken)}`);

    // Verify admin is redirected to dashboard
    await page.waitForURL('**/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    // Verify token is completely stripped from visible URL (Defect H)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('token');
    expect(currentUrl).not.toContain('#');
  });

  test('10.3 Invalid/garbage token on /auth/google/success redirects to /login?error=oauth_failed with human message', async ({ page }) => {
    await page.goto('/auth/google/success#token=invalid_garbage_token_value');

    // Should redirect to login with error
    await page.waitForURL('**/login?error=oauth_failed');
    await expect(page.locator('text=Google sign-in could not be completed. Please try again.')).toBeVisible();
  });

  test('10.4 Customer login page maps all OAuth error codes to friendly messages (Defect F)', async ({ page }) => {
    // 1. registration_closed
    await page.goto('/login?error=registration_closed');
    await expect(page.locator('text=New user registration is currently disabled.')).toBeVisible();

    // 2. account_disabled
    await page.goto('/login?error=account_disabled');
    await expect(page.locator('text=This account has been disabled. Please contact support.')).toBeVisible();

    // 3. access_denied
    await page.goto('/login?error=access_denied');
    await expect(page.locator('text=Access denied. You are not authorized to sign in.')).toBeVisible();

    // 4. rate_limited
    await page.goto('/login?error=rate_limited');
    await expect(page.locator('text=Too many sign-in attempts. Please wait a few minutes before trying again.')).toBeVisible();
  });

  test('10.5 Admin login page maps OAuth error codes to friendly messages (Defect F)', async ({ page }) => {
    // 1. access_denied
    await page.goto('/admin/login?error=access_denied');
    await expect(page.locator('text=Access denied. Your Google account is not whitelisted for admin access.')).toBeVisible();

    // 2. account_disabled
    await page.goto('/admin/login?error=account_disabled');
    await expect(page.locator('text=This admin account has been disabled. Please contact the administrator.')).toBeVisible();

    // 3. rate_limited
    await page.goto('/admin/login?error=rate_limited');
    await expect(page.locator('text=Too many authentication attempts. Please wait a few minutes before trying again.')).toBeVisible();
  });

  test('10.6 bfcache pageshow resets button state and prevents stuck "Redirecting..." state (Defect G)', async ({ page }) => {
    await page.goto('/login');

    const googleBtn = page.getByRole('button', { name: /sign in with google/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();

    // Simulate page restoration from bfcache (pageshow with persisted: true)
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });

    await expect(googleBtn).toBeEnabled();
    await expect(googleBtn).toContainText('Sign in with Google');
  });
});
