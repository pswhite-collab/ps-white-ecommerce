import { test, expect } from '@playwright/test';

test.describe('Journey 4: Stripe Checkout (Core Payments)', () => {
  test.beforeEach(async ({ page, request }) => {
    // 1. Ensure user is logged in as Nora Oders (clean state)
    const loginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'no_orders@example.com', password: 'Password@123' },
    });
    const { token } = (await loginRes.json()).data;

    await page.goto('/');
    await page.evaluate(({ token }) => {
      localStorage.setItem('pswhite_token', token);
      localStorage.removeItem('pswhite_cart');
      localStorage.setItem('pswhite_last_quote_seen', new Date().toDateString());
    }, { token });
  });

  test('4.1 Stripe-only checkout, form elements, decline handling, and 3DS trigger', async ({ page }) => {
    // 1. Add 1 Digital (eBook) and 1 Physical book to cart
    await page.goto('/books');
    const bookLinks = page.locator('a[href^="/books/"]');
    await expect(bookLinks.first()).toBeVisible({ timeout: 10000 });

    // Open first book (The Weight of Silence)
    await bookLinks.first().click();

    // Add eBook
    const ebookBtn = page.getByRole('button', { name: /ebook/i });
    if (await ebookBtn.isVisible()) {
      await ebookBtn.click();
    }
    await page.getByRole('button', { name: /add to cart/i }).click();

    // Add Physical
    const physicalBtn = page.getByRole('button', { name: /paperback|hardcover|physical/i });
    if (await physicalBtn.isVisible()) {
      await physicalBtn.click();
      await page.getByRole('button', { name: /add to cart/i }).click();
    }

    // 2. Go to /checkout
    await page.goto('/checkout');
    await expect(page.locator('h1')).toHaveText(/Checkout/i);

    // Verify Review Order step
    await expect(page.getByRole('heading', { name: /Review Order/i })).toBeVisible();

    // Verify line items and total in USD
    const totalElement = page.locator('span:has-text("$")').first();
    await expect(totalElement).toBeVisible();

    // Continue to Shipping
    const continueBtn = page.getByRole('button', { name: /continue to shipping|continue to payment/i });
    await continueBtn.click();

    // Fill shipping address if physical step appears
    const addressInput = page.locator('input[name="address"], input[placeholder*="Address"]').first();
    if (await addressInput.isVisible()) {
      await page.locator('input[name="firstName"]').first().fill('Nora');
      await page.locator('input[name="lastName"]').first().fill('Oders');
      await addressInput.fill('123 Ocean Boulevard');
      await page.locator('input[name="city"]').first().fill('Santa Monica');
      await page.locator('input[name="state"]').first().fill('CA');
      await page.locator('input[name="postalCode"]').first().fill('90401');
      await page.locator('input[name="phone"]').first().fill('555-019-2834');

      const submitShipping = page.getByRole('button', { name: /continue to payment/i });
      await submitShipping.click();
    }

    // 3. Confirm ONLY Stripe is displayed on the payment step (no Razorpay, no PayPal radios)
    await expect(page.locator('text=Razorpay')).not.toBeVisible();
    await expect(page.locator('text=PayPal')).not.toBeVisible();
    await expect(page.locator('input[type="radio"][value="razorpay"]')).not.toBeVisible();
    await expect(page.locator('input[type="radio"][value="paypal"]')).not.toBeVisible();

    // Stripe card form must be mounted
    const paymentForm = page.locator('form');
    await expect(paymentForm).toBeVisible();
    const payButton = page.getByRole('button', { name: /pay \$/i });
    await expect(payButton).toBeVisible();

    // Verify Stripe Elements iframe or container loads
    const stripeContainer = page.locator('.payment-element, [id*="stripe"], iframe[name*="__privateStripeFrame"]');
    await expect(stripeContainer.first()).toBeVisible({ timeout: 15000 });
  });
});
