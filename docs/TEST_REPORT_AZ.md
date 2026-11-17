# PS White — Full A-to-Z Test & Hosting Readiness Report

**Date:** November 17, 2026  
**Branch:** `chore/az-test-and-cleanup`  
**Test Environment:** Local Node.js 24 + Express (`PORT=5000`, `pswhite_local` MongoDB), Vite + React 18 (`PORT=5173`), Playwright (Chromium, Firefox, WebKit), Axe Core WCAG 2.1 AA.

---

## 1. Executive Summary & Raw Tally

A total of **169 verification items** were evaluated across the PS White e-commerce system:

| Test Suite / Phase | Total Items | Passed | Failed | Skipped | BLOCKED (Needs Owner) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Phase 2.1: Page Matrix** (23 routes × 5 viewports) | 115 | 115 | 0 | 0 | 0 |
| **Phase 2.2: Deep Flows & Special Cases** (`atoz-phase2-deep.spec.js`) | 17 | 17 | 0 | 0 | 0 |
| **Phase 2.2: User Journey Flows** (`atoz-flows.spec.js`) | 10 | 10 | 0 | 0 | 0 |
| **Phase 2.2: Automated Accessibility Audit** (Axe WCAG 2.1 AA) | 5 | 5 | 0 | 0 | 0 |
| **Phase 2.2: Performance & CWV Simulation** (CLS < 0.1, LCP < 4s) | 2 | 2 | 0 | 0 | 0 |
| **Phase 2 Smoke: Cross-Browser Core Flows** (Chromium, Firefox, WebKit) | 3 | 3 | 0 | 0 | 0 |
| **Phase 2.3: Hosting-Readiness 12-Point Suite** (`hostingReadiness.test.js`)| 12 | 12 | 0 | 0 | 0 |
| **Production Build Rehearsal** (`vite build` in 4.11s) | 1 | 1 | 0 | 0 | 0 |
| **External Live Service Validations** (see Section 6) | 4 | 0 | 0 | 0 | 4 |
| **TOTAL** | **169** | **165** | **0** | **0** | **4** |

---

## 2. Phase 2.1: Per-Route Page Matrix Results

All 23 routes were tested across 5 distinct screen viewports:
- **1920×1080** (Desktop Wide)
- **1525×864** at 1.25x device scale factor (Standard Laptop / High-DPI)
- **1024×768** (Tablet Landscape)
- **768×1024** (Tablet Portrait)
- **390×844** (Mobile Phone)

Every test verified:
- Clean render without 4xx/5xx or unhandled console errors
- Page title & single semantic `<h1>` hierarchy
- Absence of horizontal body scrollbars (`scrollWidth <= clientWidth`)
- No broken images (`naturalWidth > 0`)
- SPA refresh durability (browser reload maintains active route and state)
- Full-viewport screenshots recorded in `test-artifacts/pages/<route>/<viewport>.png`

### Route Matrix Breakdown

| Route ID | Path | Access Level | Component | 1920 | 1525 | 1024 | 768 | 390 |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `home` | `/` | Public | `Home.jsx` | PASS | PASS | PASS | PASS | PASS |
| `books` | `/books` | Public | `Books.jsx` | PASS | PASS | PASS | PASS | PASS |
| `book-detail` | `/books/:id` | Public | `BookDetail.jsx` | PASS | PASS | PASS | PASS | PASS |
| `blog` | `/blog` | Public | `Blog.jsx` | PASS | PASS | PASS | PASS | PASS |
| `blog-post` | `/blog/:slug` | Public | `BlogPost.jsx` | PASS | PASS | PASS | PASS | PASS |
| `login` | `/login` | Public | `Login.jsx` | PASS | PASS | PASS | PASS | PASS |
| `register` | `/register` | Public | `Register.jsx` | PASS | PASS | PASS | PASS | PASS |
| `cart` | `/cart` | Public | `Cart.jsx` | PASS | PASS | PASS | PASS | PASS |
| `checkout` | `/checkout` | Customer | `Checkout.jsx` | PASS | PASS | PASS | PASS | PASS |
| `order-success`| `/order-success/:id`| Customer | `OrderSuccess.jsx`| PASS | PASS | PASS | PASS | PASS |
| `library` | `/library` | Customer | `Library.jsx` | PASS | PASS | PASS | PASS | PASS |
| `reader` | `/reader/:bookId` | Customer | `Reader.jsx` | PASS | PASS | PASS | PASS | PASS |
| `admin-login` | `/admin/login` | Public | `AdminLogin.jsx` | PASS | PASS | PASS | PASS | PASS |
| `admin-dashboard` | `/admin/dashboard`| Admin | `AdminDashboard.jsx`| PASS | PASS | PASS | PASS | PASS |
| `admin-manage-books`| `/admin/manage-books`| Admin | `ManageBooks.jsx` | PASS | PASS | PASS | PASS | PASS |
| `admin-orders` | `/admin/orders` | Admin | `ManageOrders.jsx`| PASS | PASS | PASS | PASS | PASS |
| `admin-customers`| `/admin/customers` | Admin | `Customers.jsx` | PASS | PASS | PASS | PASS | PASS |
| `admin-reading-analytics`| `/admin/reading-analytics`| Admin | `ReadingAnalytics.jsx`| PASS | PASS | PASS | PASS | PASS |
| `admin-quotes` | `/admin/quotes` | Admin | `ManageQuotes.jsx`| PASS | PASS | PASS | PASS | PASS |
| `admin-reviews`| `/admin/reviews` | Admin | `ManageReviews.jsx`| PASS | PASS | PASS | PASS | PASS |
| `admin-blog` | `/admin/blog` | Admin | `ManageBlog.jsx` | PASS | PASS | PASS | PASS | PASS |
| `admin-newsletter`| `/admin/newsletter`| Admin | `ManageNewsletter.jsx`| PASS | PASS | PASS | PASS | PASS |
| `admin-settings`| `/admin/settings` | Admin | `Settings.jsx` | PASS | PASS | PASS | PASS | PASS |

---

## 3. Phase 2.2: Deep Flows, Special Cases & Security Results

### 3.1 Stripe Payment Special Cases
- **Stripe 1: Success Payment Flow**: Order created, simulated payment confirmed, order marked `status: 'completed'` / `payment.status: 'paid'`, cart cleared, and eBook immediately provisioned into customer digital library (`/api/reading/library`). (PASS)
- **Stripe 2: Decline Payment Flow**: Invalid or declined payment intent rejected with HTTP 400/402. Order remains in unpaid status in database, cart items preserved for retry. (PASS)
- **Stripe 3: 3-D Secure Incomplete Handling**: PaymentIntent requiring customer action (`requires_action` / challenge) is rejected by confirm endpoint; order is never prematurely marked as paid. (PASS)
- **Stripe 4: Idempotency & Retry**: Re-initiating payment for an existing order reuses the existing active `PaymentIntent` rather than creating duplicate orders or duplicate intents. (PASS)

### 3.2 Admin CRUD Operations
- **Books**: Create new book with multiple formats, update title/featured status, soft delete/archive. (PASS)
- **Orders**: View all orders (`/api/orders/all`), filter by status, update fulfillment status to `shipped` with tracking number. (PASS)
- **Quotes**: Create quote with date range, update text, toggle active status, delete quote. (PASS)
- **Blog**: Create blog post draft, edit content, toggle published status, delete post. (PASS)
- **Newsletter**: Query subscribers list, verify pagination and counts. (PASS)
- **Reviews**: Approve customer reviews, reject/hide spam or inappropriate reviews. (PASS)

### 3.3 Site Settings & Controls
- Update site name, free shipping threshold ($50 → $60), `allowRegistration`, and maintenance mode toggling. (PASS)

### 3.4 Security & Abuse Defenses
- **NoSQL Injection Blocked**: NoSQL query objects (`{ $gt: '' }`, `search[$regex]=.*`) in authentication and catalog search are safely sanitized and blocked without unhandled 500 errors. (PASS)
- **Cross-Account IDOR Protection**: Customer 1 is strictly forbidden from reading Customer 2's orders or executing payment confirmation on another customer's order (HTTP 403/404). (PASS)
- **Price Tampering Protection**: Client sending fabricated prices (`price: 0.001`) has subtotal recalculated by the server using verified catalog database prices. (PASS)
- **XSS Defense**: Cross-site scripting tags (`<script>`, `onerror=`) in review comments are sanitized. (PASS)
- **Resilience & Fault Tolerance**: Corrupted JWTs in `localStorage` trigger clean redirection to `/login` without application crash or infinite loops; nonexistent routes cleanly render the application shell. (PASS)

---

## 4. Phase 2.3: Hosting-Readiness 12-Point Evidence Table

| # | Requirement | What the Test Asserts | Exact File & Lines | Introduced / Fixed In |
| :-: | :--- | :--- | :--- | :--- |
| **1** | `trust proxy` configured | Asserts `server.js` contains `app.set('trust proxy', ...)` so rate limiters inspect real client IP headers behind proxies (Vercel, Hostinger, Nginx). | `backend/server.js`<br>Lines 64–66 | Commit `c7ca163`<br>*(earlier PR review)* |
| **2** | Multi-origin `CLIENT_URL` helper | Asserts `getAllowedOrigins()` parses comma-delimited strings with trailing slashes, whitespace, and returns clean URL strings; `getPrimaryClientUrl()` returns first valid entry. | `backend/config/clientUrl.js`<br>Lines 1–40 | Commit `c7ca163`<br>*(earlier PR review)* |
| **3** | Safe admin URL resolution | Asserts `getAdminGoogleAuthUrl()` handles URLs with `/api` without corrupting origin (e.g. `https://api.ps-white.com/api` → `https://api.ps-white.com/api/admin/auth/google`). | `frontend/src/utils/apiConfig.js`<br>Lines 25–40 | Commit `b6f24dc`<br>*(earlier PR review)* |
| **4** | Build validation for `VITE_API_URL` | Asserts `getApiBaseUrl()` handles production mode safely by logging configuration errors if missing, falling back to relative `/api`. | `frontend/src/utils/apiConfig.js`<br>Lines 1–22 | Commit `b6f24dc`<br>*(earlier PR review)* |
| **5** | `vercel.json` SPA rewrite | Asserts `frontend/vercel.json` exists and contains rewrite rule from `/(.*)` to `/index.html` preventing 404 on direct route navigation. | `frontend/vercel.json`<br>Lines 1–9 | Commit `b6f24dc`<br>*(earlier PR review)* |
| **6** | Startup fail-fast env check | Asserts `checkEnv(isProduction)` returns structured validation status and error list, aborting boot if critical variables are missing. | `backend/utils/checkEnv.js`<br>`backend/server.js` (L48) | Commit `4e448c2`<br>*(earlier PR review)* |
| **7** | CORS rejects unknown origins with 403 | Asserts unauthorized origins rejected by CORS return HTTP `403` status instead of defaulting to internal server error `500`. | `backend/middleware/errorHandler.js`<br>Lines 11–13 | Commit `b01b31c`<br>*(Phase 2 fix)* |
| **8** | Static asset caching headers | Asserts `server.js` static file serving sets `Cache-Control: public, max-age=31536000, immutable` for `/assets/` directory. | `backend/server.js`<br>Lines 185–195 | Commit `b01b31c`<br>*(Phase 2 fix)* |
| **9** | Dev token helper blocked in production | Asserts `devToken.js` and development sample reader endpoints throw errors and refuse execution when `NODE_ENV === 'production'`. | `backend/utils/devToken.js`<br>`backend/controllers/readingController.js` | Commit `b01b31c`<br>*(Phase 2 fix)* |
| **10**| Multer memory safety bounded | Asserts multer file upload limits are safely bounded to prevent Node heap memory starvation (`<= 100MB`). | `backend/middleware/upload.js`<br>Lines 45–55 | Commit `b01b31c`<br>*(Phase 2 fix)* |
| **11**| Ecosystem config for PM2 versatility | Asserts `ecosystem.config.js` exists in both root and `backend/` directory so `pm2 start` works seamlessly from any execution path. | `ecosystem.config.js`<br>`backend/ecosystem.config.js` | Commit `b01b31c`<br>*(Phase 2 fix)* |
| **12**| Raw body parser for Stripe webhook | Asserts `app.use('/api/payment/stripe/webhook', express.raw(...))` is mounted before `express.json()` to preserve webhook signature validation. | `backend/server.js`<br>Lines 121–123 | Commit `378e952`<br>*(Stripe PR)* |

*Note on compression:* Express static compression is offloaded to the edge CDN/proxy layer (Vercel CDN / Nginx / Cloudflare), while Express provides long-term immutable caching headers.

---

## 5. Comprehensive Secrets Scan Results

Full git history and working tree content scans were executed for secret tokens, credentials, and patterns:
- Patterns scanned: `sk_live_`, `sk_test_`, `whsec_`, `mongodb+srv://user:pass@`, `AIza`, `GOCSPX-`, `re_[a-zA-Z0-9_]{24,}`, `pk_live_`, `pk_test_`.

### Results:
1. **Commit History Diff Scan (`git log -p --all --full-history`):**
   - **0 Real Secrets Found.**
   - Only 2 matches detected: generic placeholder templates in example files (`MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pswhite` in `backend/.env.example` and `backend/.env.production.example`).
2. **Current Tracked Files Scan (`git ls-files` - 324 files):**
   - **0 Matches Found.**
   - No `.env` files or secret tokens are tracked by git.

---

## 6. Status of External Services & Manual Steps for BLOCKED Items

### 6.1 Stripe Payment Testing (Missing Test Keys)
- **Status:** **BLOCKED (Requires Stripe TEST Keys)**.
- **Audit Findings:** The existing local and production `.env` files contain live keys (`pk_live_...` and `sk_live_...`).
- When Stripe Elements loads a `pk_live_` key, Stripe's client-side library disables testing and rejects test card numbers (`4242 4242...`, `4000 0000...`, `4000 0025...`) with "Your card number is invalid".
- **To test live test cards in browser:**
  1. Add a Stripe Test Publishable Key (`pk_test_...`) to `frontend/.env.local` as `VITE_STRIPE_PUBLISHABLE_KEY`.
  2. Add a Stripe Test Secret Key (`sk_test_...`) to `backend/.env.local-test` as `STRIPE_SECRET_KEY`.
  3. Run test cards in browser:
     - **Success:** Card `4242 4242 4242 4242` (Exp 12/28, CVC 123) → Order marked paid, cart cleared, redirect to `/order-success/:id`, eBook appears in `/library`.
     - **Decline:** Card `4000 0000 0000 0002` → Displays error message, order remains unpaid, cart preserved.
     - **3-D Secure:** Card `4000 0025 0000 3155` → Triggers Stripe 3DS authentication modal.
     - **Double-Click Pay:** Pay button disables on first click with `loading` state to prevent duplicate charge.

### 6.2 Real Google OAuth 2.0 Live Roundtrip
- **Status:** **BLOCKED (Requires Owner Google Account)**.
- **Steps to Verify:**
  1. Navigate to `http://localhost:5173/login`.
  2. Click "Sign in with Google".
  3. Authenticate via Google OAuth consent screen.
  4. Verify redirect returns to `/library` with JWT session token stored and user name displayed.

### 6.3 Real Cloudinary File Upload
- **Status:** **BLOCKED (Requires Live Cloudinary Credentials)**.
- **Steps to Verify:**
  1. Log in to `/admin/dashboard` → `/admin/manage-books`.
  2. Click "Edit Book" → Upload a cover image.
  3. Verify image loads from `res.cloudinary.com`.

### 6.4 Real Resend Transactional Email Delivery
- **Status:** **BLOCKED (Requires Live Resend API Key & Verified Domain)**.
- **Steps to Verify:**
  1. Place an order on `/checkout`.
  2. Check recipient email inbox for "Order Confirmation #ORD-..." with itemized book summary.

---

## 7. Large File & Audiobook Upload Analysis (100MB vs 500MB)

### Previous Limits:
- Cover Images (`uploadCover`): 10 MB
- eBooks (`uploadEbook`): 50 MB
- Audiobooks (`uploadAudio`): **500 MB** *(previously configured)*
- Generic Upload (`upload`): **500 MB** *(previously configured)*

### Memory Risk with 500MB:
`multer.memoryStorage()` buffers the entire file payload into a single Node.js V8 memory `Buffer`. A 500MB audiobook upload requires >500MB of resident RAM. On servers or containers with 512MB–1GB RAM limits, concurrent uploads or large files will trigger Node.js Out-Of-Memory (OOM) crashes (`exit code 137`).

### Streaming Proposal (For Owner Decision):
1. **Option A (Disk Spooling + Stream to Cloudinary - Recommended for Simplicity):**
   - Switch `multer` from `memoryStorage()` to `diskStorage({ destination: os.tmpdir() })`.
   - Multer streams chunks directly to a temporary file on disk (consuming ~0 RAM).
   - Use `fs.createReadStream(tempPath).pipe(cloudinary.uploader.upload_stream({ resource_type: 'video' }, callback))`.
   - Delete temporary file upon upload completion. Allows audiobooks up to 1GB–2GB safely.
2. **Option B (Direct Browser-to-Cloudinary Upload - Recommended for Production Scale):**
   - Backend provides a lightweight signed upload endpoint: `POST /api/upload/sign`.
   - Admin frontend sends large audiobook files directly from browser to Cloudinary's upload API via HTTPS multipart POST.
   - Large file bandwidth and memory completely bypass the Express backend server.

---

*Report generated and verified against branch `chore/az-test-and-cleanup`.*
