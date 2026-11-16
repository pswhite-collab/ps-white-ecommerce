# Changes & Architecture Record

## Architectural Setup & Core Enhancements
- **Early Environment Loading (`backend/config/env.js`)**:
  - Ensured `.env` is loaded before any other modules read `process.env`.
  - Added support for isolated test environments via `APP_ENV=local-test` or `NODE_ENV=test` loading `backend/.env.local-test`.
- **Site Settings Infrastructure (`backend/utils/siteSettings.js`)**:
  - Implemented cached site settings retrieval (`maintenanceMode`, `allowRegistration`, `freeShippingThreshold`, `currency`).
  - Added public settings endpoint `GET /api/settings/public` in `settingsController.js` and `routes/settings.js`.
- **Maintenance Middleware (`backend/middleware/maintenance.js`)**:
  - Enforced 503 response across public API routes when `maintenanceMode: true`.
  - Allowed bypasses for `/health`, `/api/test`, `/api/settings/public`, `/api/admin/*`, `/api/payment/stripe/webhook`, and authenticated admin tokens.
- **Frontend Settings Context (`frontend/src/context/SiteSettingsContext.jsx`)**:
  - Global React Context providing reactive site settings and document title synchronization.
  - Wrapped around the application in `frontend/src/main.jsx`.
- **Store Policies & Security Enforcements**:
  - `allowRegistration`: Server-side rejection (HTTP 403) of new customer registrations and new Google sign-ups when registration is disabled.
  - `freeShippingThreshold`: Automatically applied server-side in `orderController.js` when order subtotal meets or exceeds the configured threshold.

## Phase 1: Stripe-Only Payments (Removal of Razorpay & PayPal)
- **Frontend Checkout (`frontend/src/pages/Checkout.jsx`)**:
  - Completely removed Razorpay SDK loading scripts, PayPal popup/redirects, and the 3-option payment radio selector.
  - Embedded the official Stripe Payment Element directly in the checkout flow using a deferred-intent workflow (`elements.submit()` -> `createOrder` -> `createStripeIntent` -> `stripe.confirmPayment` -> server `confirmStripePayment`).
  - Enforced all orders to transmit `paymentMethod: 'stripe'` and `currency: 'USD'`.
  - Preserved order retry capability on card decline without creating duplicate orders.
- **Frontend Payment Service (`frontend/src/services/paymentService.js`)**:
  - Purged all Razorpay and PayPal service calls.
  - Kept only `createStripeIntent` and `confirmStripePayment`.
- **Backend Payment Controller (`backend/controllers/paymentController.js`)**:
  - Deleted `razorpayClient`, `createRazorpayOrder`, `verifyRazorpayPayment`, `createPayPalOrder`, `capturePayPalOrder`, and unused helpers.
  - Implemented `canAccessOrder` for strict IDOR prevention (owner or admin only).
  - Implemented `evaluateStripeIntent` to verify payment intent status (`succeeded`), exact amount in cents, matching currency, and metadata `orderId`.
  - Implemented `finalizePaidOrder` to idempotently transition orders to paid status (`processing` for physical, `completed` for digital), grant digital access to user libraries, and send confirmation emails once.
  - Uninstalled `razorpay` npm package from `backend/package.json`.
- **Data Models & Validation**:
  - Updated `backend/models/Order.js` default currency to `USD` and default payment method to `stripe` (preserving legacy strings `razorpay`/`paypal` for historical record compatibility).
  - Updated `backend/utils/validation.js` to accept `paymentMethod: Joi.string().valid('stripe').default('stripe')` and `currency: USD`.
  - Updated Helmet Content Security Policy in `backend/server.js` to remove Razorpay domains while retaining all required Stripe domains.
  - Updated `backend/utils/deepSmokeTest.js` to exercise only Stripe payment intents and confirmation.
