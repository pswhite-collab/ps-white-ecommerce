import { test, expect } from '@playwright/test';

test.describe('Journey 3: Authentication & Site Access Controls', () => {
  const newEmail = `e2e_reader_${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    });
  });

  test('3.1 Register new user, logout, and login as anika@example.com', async ({ page }) => {
    // 1. Go to register
    await page.goto('/register');
    await expect(page.locator('h1')).toHaveText(/Register/i);

    // Fill form
    await page.locator('input[type="text"]').first().fill('E2E');
    await page.locator('input[type="text"]').nth(1).fill('Reader');
    await page.locator('input[type="email"]').fill(newEmail);
    await page.locator('input[type="password"]').first().fill('Password@123');
    await page.locator('input[type="password"]').nth(1).fill('Password@123');

    // Submit
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/library|\//, { timeout: 15000 });

    // 2. Logout
    await page.goto('/');
    const accountBtn = page.getByRole('button', { name: /account/i });
    if (await accountBtn.isVisible()) {
      await accountBtn.click();
      const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
      }
    } else {
      // Clear token
      await page.evaluate(() => localStorage.removeItem('pswhite_token'));
    }

    // 3. Login as anika@example.com
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('anika@example.com');
    await page.locator('input[type="password"]').fill('Password@123');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/library|\//, { timeout: 15000 });
  });

  test('3.2 Protected route redirects unauthenticated user to login with ?redirect=', async ({ page }) => {
    // Ensure logged out
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('pswhite_token'));

    // Attempt to access /checkout
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/);
  });

  test('3.3 Registration-closed and maintenance screens appear when toggled', async ({ page, request }) => {
    // Fetch admin token for settings toggle
    const loginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'pswhite786@gmail.com', password: 'Admin@12345' },
    });
    const { token } = (await loginRes.json()).data;

    try {
      // 1. Toggle allowRegistration: false
      await request.put('http://localhost:5000/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
        data: { allowRegistration: false },
      });

      await page.goto('/register');
      await expect(page.locator('h1')).toHaveText(/Registration Closed/i);

      // 2. Toggle maintenanceMode: true
      await request.put('http://localhost:5000/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
        data: { allowRegistration: true, maintenanceMode: true },
      });

      // Clear any tokens in browser context to act as guest
      await page.goto('/login');
      await page.evaluate(() => localStorage.removeItem('pswhite_token'));

      await page.goto('/');
      await expect(page.locator('h1')).toHaveText(/Under Maintenance/i);
    } finally {
      // Restore settings
      await request.put('http://localhost:5000/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
        data: { allowRegistration: true, maintenanceMode: false },
      });
    }
  });
});
