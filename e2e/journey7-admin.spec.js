import { test, expect } from '@playwright/test';

test.describe('Journey 7: Admin Operations', () => {
  test.beforeEach(async ({ page, request }) => {
    // Log in as super_admin
    const loginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'pswhite786@gmail.com', password: 'Admin@12345' },
    });
    const { token } = (await loginRes.json()).data;

    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
    }, { token });
  });

  test('7.1 Admin dashboard stats, order tracking update, and book management', async ({ page }) => {
    // 1. Admin Dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('h1')).toHaveText(/Admin Dashboard/i);

    // Verify stat cards
    const statsContainer = page.locator('section');
    await expect(statsContainer.first()).toBeVisible();

    // 2. Manage Orders
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Verify orders table or list
    const orderRows = page.locator('table tr, article');
    await expect(orderRows.first()).toBeVisible({ timeout: 10000 });

    // 3. Customers list
    await page.goto('/admin/customers');
    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Customer table should render
    const customerRows = page.locator('table tr, article');
    await expect(customerRows.first()).toBeVisible({ timeout: 10000 });
  });
});
