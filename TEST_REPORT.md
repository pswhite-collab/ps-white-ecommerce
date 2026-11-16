# PS White Local Test Report

**Branch:** `fix/stripe-only-header-fulltest`  
**Date:** November 16, 2026  
**Target Environment:** Local Isolated Test Suite (`pswhite_local`)  

---

## 1. Executive Summary

This report documents the verification, bug fixes, and testing of the **PS White e-commerce application** following:
1. **Total removal of Razorpay and PayPal**, establishing **Stripe as the exclusive payment processor** in USD.
2. **Precision re-centering and resizing of the "PS White" header logo** to match the design reference (~90px header height, Cormorant Garamond, mathematically centered within ±0.01px across all viewports).
3. **Comprehensive static and dynamic error fixes** across backend routes, controllers, middleware, and frontend components.
4. **Idempotent demo data seeding** covering 16 books (all formats, low stock, zero stock, free, archived), 9 customer personas, orders, reviews, and quotes.
5. **Execution of the 45-test Backend API Suite** and the **17-test Playwright End-to-End Suite**, achieving a **100% PASS rate**.

---

## 2. Test Environment Specification

| Component | Specification / Version |
| :--- | :--- |
| **Operating System** | Windows 11 (build 26100) |
| **Node.js** | v22.14.0 |
| **Database** | MongoDB Community Server (localhost:27017, database: `pswhite_local`) |
| **Frontend Framework** | React 18.2.0, Vite 6.4.1, Tailwind CSS 3.4.1 |
| **Backend Framework** | Express 4.18.2, Mongoose 8.2.1 |
| **Test Runners** | Node native test runner (`node:test`, `node:assert/strict`) & Playwright 1.50+ |
| **Stripe Integration** | **TEST Mode Only** (`sk_test_...` and `pk_test_...` verified against Stripe API) |
| **Database Safety Guard** | Active: All seed & test processes enforce `dbName.endsWith('_local') || dbName.endsWith('_test')` |

---

## 3. Test Results Matrix

### 3.1 Backend API Test Suite (`node --test`) — 45 / 45 Passed

*Total Duration: 2.10s*

| # | Test Suite & Description | Result | Execution Time |
| :--- | :--- | :---: | :--- |
| **5.1** | **Authentication & Site Security** | | |
| 5.1.1 | Register customer (201, password hashed in DB, role: customer) | **PASS** | 145 ms |
| 5.1.2 | Register with duplicate email returns 409 Conflict | **PASS** | 4.3 ms |
| 5.1.3 | Register with weak password returns 400 Bad Request | **PASS** | 3.2 ms |
| 5.1.4 | Login valid customer returns 200 with signed JWT token | **PASS** | 56 ms |
| 5.1.5 | Login wrong password returns 401 Unauthorized | **PASS** | 55 ms |
| 5.1.6 | Protected route without token returns 401 Unauthorized | **PASS** | 2.1 ms |
| 5.1.7 | Protected route with malformed token returns 401 Unauthorized | **PASS** | 1.6 ms |
| 5.1.8 | NoSQL injection attempt on login (`{ "$gt": "" }`) rejected with 400 | **PASS** | 1.7 ms |
| **5.2** | **Site Settings & Access Controls** | | |
| 5.2.1 | `GET /api/settings/public` works without authentication | **PASS** | 3.1 ms |
| 5.2.2 | `PUT /api/admin/settings` requires admin role (401 without auth, 403 for customer) | **PASS** | 11.6 ms |
| 5.2.3 | When `allowRegistration: false`, `POST /api/auth/register` returns 403 Forbidden | **PASS** | 12.2 ms |
| 5.2.4 | When `maintenanceMode: true`, normal routes return 503; whitelisted routes bypass | **PASS** | 17.2 ms |
| 5.2.5 | Free shipping threshold logic applies correctly ($50 free, $5 under threshold) | **PASS** | 10.7 ms |
| **5.3** | **Books & Catalog Operations** | | |
| 5.3.1 | `GET /api/books` returns active books with default limit of 8 | **PASS** | 4.6 ms |
| 5.3.2 | Filter books by genre (`Thriller`), format (`ebook`), and `featured` flag | **PASS** | 14.0 ms |
| 5.3.3 | Search with regex special characters (`(`, `*`, `?`) does not crash (no 500) | **PASS** | 2.6 ms |
| 5.3.4 | `GET /api/books/:id` for valid ID returns book with reviews | **PASS** | 8.1 ms |
| 5.3.5 | `GET /api/books/not-an-objectid` returns clean 404 (not 500) | **PASS** | 1.1 ms |
| 5.3.6 | `GET /api/books/:id` for inactive book returns 404 for guest, 200 for admin | **PASS** | 6.2 ms |
| 5.3.7 | `maxPrice` query param returns books with price <= maxPrice | **PASS** | 3.3 ms |
| **5.4** | **Customer Reviews & Moderation** | | |
| 5.4.1 | Customer who purchased book can submit review (201 Created) | **PASS** | 13.1 ms |
| 5.4.2 | Same customer cannot submit a second review for the same book (400) | **PASS** | 4.0 ms |
| 5.4.3 | Review rating must be an integer between 1 and 5 | **PASS** | 3.0 ms |
| 5.4.4 | Only approved reviews appear on `GET /api/reviews/book/:bookId` | **PASS** | 4.4 ms |
| **5.5** | **Orders, Inventory & Stock Decrement** | | |
| 5.5.1 | Digital-only order requires no physical shipping address | **PASS** | 6.7 ms |
| 5.5.2 | Physical order without shipping address is rejected with 400 | **PASS** | 4.0 ms |
| 5.5.3 | Creating physical order decrements book stock in database | **PASS** | 8.1 ms |
| 5.5.4 | Ordering more than available stock is rejected with 400 | **PASS** | 4.8 ms |
| 5.5.5 | Customer A cannot read Customer B's order by ID (IDOR prevention returns 403) | **PASS** | 5.7 ms |
| 5.5.6 | Price tampering: client sending manipulated item price is recalculated from DB | **PASS** | 7.1 ms |
| **5.6** | **Stripe-Only Payment Flow** | | |
| 5.6.1 | `POST /api/payment/stripe/create-intent` creates real PaymentIntent on Stripe | **PASS** | 441 ms |
| 5.6.2 | Calling create-intent twice for same order returns same client secret (idempotent) | **PASS** | 223 ms |
| 5.6.3 | `POST /api/payment/stripe/confirm` verifies payment and rejects invalid intent IDs | **PASS** | 4.4 ms |
| 5.6.4 | Webhook endpoint rejects invalid signatures with 400 | **PASS** | 2.0 ms |
| **5.7** | **Admin Dashboard & Management** | | |
| 5.7.1 | Non-admin calling `/api/admin/*` gets 401 or 403 | **PASS** | 3.2 ms |
| 5.7.2 | Admin can create, update, and delete book (full CRUD lifecycle) | **PASS** | 14.9 ms |
| 5.7.3 | Admin can update order tracking and carrier info | **PASS** | 8.6 ms |
| 5.7.4 | Admin can view customer list with order summaries and spend totals | **PASS** | 8.5 ms |
| **5.8** | **Uploads & Static Content Access** | | |
| 5.8.1 | Sample EPUB, PDF, and MP3 files are downloadable via sample endpoints | **PASS** | 6.5 ms |
| 5.8.2 | Unauthenticated user cannot download full book content (401) | **PASS** | 2.4 ms |
| 5.8.3 | Authenticated user who has not bought the book gets 403 on download | **PASS** | 4.5 ms |
| **5.9** | **eReader & Library State** | | |
| 5.9.1 | Customer can fetch owned books in their library | **PASS** | 6.7 ms |
| 5.9.2 | Reading progress save and resume persists and can be retrieved | **PASS** | 12.1 ms |
| **5.10** | **Security Sanity** | | |
| 5.10.1 | Helmet headers (`X-Content-Type-Options`, CSP, HSTS) are present on responses | **PASS** | 1.2 ms |
| 5.10.2 | Unknown API route returns clean JSON 404 | **PASS** | 1.0 ms |

---

### 3.2 Playwright End-to-End Test Suite — 17 / 17 Passed

*Total Duration: 44.2s*

| Journey | Spec & Description | Result | Execution Time |
| :--- | :--- | :---: | :--- |
| **Journey 1** | Guest browsing: homepage, featured books, quotes, catalog, book details, blog, anchor navigation | **PASS** | 3.7 s |
| **Journey 2** | Cart operations: add eBook, add physical, quantity adjust, item removal, badge synchronization, reload persistence | **PASS** | 2.4 s |
| **Journey 3** | Authentication & site controls: register user, logout, login as `anika@example.com` | **PASS** | 2.3 s |
| **Journey 3** | Protected route redirects unauthenticated user to login preserving `?redirect=` | **PASS** | 1.9 s |
| **Journey 3** | Registration-closed banner and maintenance mode screen render appropriately | **PASS** | 2.2 s |
| **Journey 4** | Core Stripe checkout: card form mounts, no method selector, decline message, 3DS authentication flow | **PASS** | 2.2 s |
| **Journey 5** | Reading experience: open library, launch reader, turn page, save bookmark, verify bookmark persistence | **PASS** | 4.5 s |
| **Journey 6** | Reviews & moderation: display verified reviews, admin moderation dashboard approve / reject actions | **PASS** | 2.3 s |
| **Journey 7** | Admin dashboard: metrics overview, order carrier & tracking updates, book management | **PASS** | 3.2 s |
| **Journey 8** | Responsive Header: Logo is mathematically centered (offset < 0.05px) at **1920px** | **PASS** | 2.0 s |
| **Journey 8** | Responsive Header: Logo is mathematically centered (offset < 0.05px) at **1906px** (Reference Viewport) | **PASS** | 2.0 s |
| **Journey 8** | Responsive Header: Logo is mathematically centered (offset < 0.05px) at **1440px** | **PASS** | 1.8 s |
| **Journey 8** | Responsive Header: Logo is mathematically centered (offset < 0.05px) at **1024px** | **PASS** | 1.8 s |
| **Journey 8** | Responsive Header: Logo is mathematically centered (offset < 0.05px) at **768px** | **PASS** | 1.9 s |
| **Journey 8** | Responsive Header: Logo is mathematically centered (offset < 0.05px) at **390px** (Mobile) | **PASS** | 1.9 s |
| **Journey 8** | Responsive Header: Mobile hamburger menu opens drawer smoothly on 390px viewport | **PASS** | 1.7 s |
| **Journey 9** | Accessibility basics: valid heading hierarchy (single `h1`), image `alt` attributes, keyboard focusability | **PASS** | 2.3 s |

---

## 4. Header Centering & Design Verification

Following the attached design reference screenshot, the header was implemented using a CSS 3-column grid (`grid-cols-[1fr_auto_1fr]`):
- **Height:** `h-[90px]` (matching the ~90px reference band, replacing previous `h-[72px]`).
- **Typography:** Cormorant Garamond font (`font-display`), `text-4xl md:text-5xl tracking-wide`.
- **Palette Mapping:** First word ("PS") in lighter taupe (`#A39382`), remaining title ("White") in mocha (`#685D54`).
- **Precision Measurements Across Viewports:**

| Viewport Width | Page Center | Logo Left Offset | Logo Width | Logo Calculated Center | Center Offset Error |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1920 px** | 960.0 px | 871.9 px | 176.2 px | 960.0 px | **0.00 px** |
| **1906 px** (Ref) | 953.0 px | 864.9 px | 176.2 px | 953.0 px | **0.00 px** |
| **1440 px** | 720.0 px | 631.9 px | 176.2 px | 720.0 px | **0.00 px** |
| **1024 px** | 512.0 px | 423.9 px | 176.2 px | 512.0 px | **0.00 px** |
| **768 px** | 384.0 px | 303.8 px | 160.4 px | 384.0 px | **0.00 px** |
| **390 px** (Mobile)| 195.0 px | 114.8 px | 160.4 px | 195.0 px | **0.00 px** |

*All viewports exhibit mathematical centering with less than 0.01 px of variance.*

---

## 5. Discovered Bugs, Root Cause Analysis & Fixes

During the static analysis, API testing, and E2E automation phases, several latent bugs were identified and resolved:

### 1. Missing `deleteBook` Export in `bookController.js`
- **Symptom:** `backend/routes/books.js` imported `deleteBook` from `bookController.js`, but `bookController.js` never exported it.
- **Root Cause:** A refactor previously implemented `archiveBook` but omitted `deleteBook`.
- **Fix:** Implemented `deleteBook` with associated review deletion and exported it in `bookController.js`.

### 2. Maintenance Mode Subpath Bypass Failure
- **Symptom:** When maintenance mode was enabled, whitelisted routes (like `/api/settings/public`) failed with 503.
- **Root Cause:** `req.path` within an Express router is relative to the mount point (e.g., `/settings/public` instead of `/api/settings/public`). The check `PUBLIC_SETTINGS_PATH = '/api/settings/public'` failed to match `req.path`.
- **Fix:** Updated `maintenance.js` to inspect both `req.originalUrl` and `req.path`.

### 3. Unescaped Regular Expressions Causing Server 500s
- **Symptom:** Submitting search queries containing `(`, `*`, `+` resulted in unhandled regex parsing exceptions and 500 errors in book catalog and admin review search.
- **Root Cause:** Raw user input was passed directly into `new RegExp(search, 'i')`.
- **Fix:** Implemented `escapeRegex = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` in `bookController.js` and `reviewController.js`.

### 4. Malformed MongoDB ObjectId Returning 500 Instead of 404
- **Symptom:** Querying `/api/books/not-an-objectid` triggered Mongoose `CastError`, caught by the generic error handler and returned as HTTP 500.
- **Root Cause:** `errorHandler.js` lacked specific handling for Mongoose `CastError`.
- **Fix:** Added `if (err.name === 'CastError') return res.status(404).json({ success: false, error: 'Resource not found' });`.

### 5. Quote Category Schema Enum Mismatch
- **Symptom:** Seeding quotes failed with validation error: `category is not a valid enum value`.
- **Root Cause:** Seed data used `'Memory'` and `'Reflection'`, whereas `models/Quote.js` enforces `['inspiration', 'motivation', 'life', 'writing', 'reading', 'general']`.
- **Fix:** Updated `seedDatabase.js` to use `'inspiration'` and `'reading'`.

### 6. Order Creation Validation Rejecting Valid Client Payloads
- **Symptom:** Checkout requests sending item `price` or `title` alongside `book` and `quantity` were rejected with 400 Bad Request.
- **Root Cause:** Joi schema strictly disallowed unknown keys on `items`.
- **Fix:** Allowed `price` and `title` in `orderCreateSchema` while maintaining server-side price recalculation from MongoDB to prevent price tampering.

### 7. Reading Progress Validation Omitting Modern Reader Fields
- **Symptom:** Saving bookmarks with e-reader EPUB CFI locations was rejected with 400.
- **Root Cause:** `bookmarkSchema` and `progressUpdateSchema` only permitted `pageNumber`, rejecting `cfi`, `title`, and `progressPercentage`.
- **Fix:** Updated `validation.js` to allow `cfi`, `title`, and `progressPercentage`.

### 8. Protected Route Redirect Query Loss
- **Symptom:** Visiting a protected route (e.g., `/library` or `/checkout`) while unauthenticated redirected to `/login`, but after logging in, the user was always navigated to `/library`, dropping their intended destination.
- **Root Cause:** `ProtectedRoute.jsx` did not encode `?redirect=...` and `Login.jsx` hardcoded `navigate('/library')`.
- **Fix:** Updated `ProtectedRoute.jsx` to append `?redirect=${encodeURIComponent(location.pathname + location.search)}` and `Login.jsx` to read and honor `searchParams.get('redirect')`.

### 9. Frontend Maintenance & Registration Closed Screens
- **Symptom:** When `allowRegistration` or `maintenanceMode` were toggled in admin settings, the frontend UI continued rendering standard forms instead of user-friendly status banners.
- **Root Cause:** Frontend components did not subscribe to site settings flags.
- **Fix:** Connected `Register.jsx` and `App.jsx` to `SiteSettingsContext` to display "Registration Closed" and "Under Maintenance" screens when active.

---

## 6. Known Suspects & Security Inspection

- **Public Assets:** Sample test files (`sample-book.epub`, `sample-book.pdf`, `sample-audio.mp3`) generated in `backend/uploads/` and verified accessible via authenticated and sample reader routes.
- **Sitemap & Robots:** Clean and functioning with valid XML structure.
- **Stripe Network Isolation:** Test mode is strictly enforced. No live keys are referenced. Webhook signature verification verified.
- **Audit Findings:** No critical or high vulnerabilities detected in root or frontend dependencies. Backend contains common low/moderate transitive parser dependencies in `node_modules` (e.g., `send`, `express-rate-limit`); these are standard library-level behaviors and are non-exploitable in the context of this local-first architecture.

---

## 7. Conclusion

All requirements for the PS White e-commerce system have been completed:
- **Phase 1 (Stripe Only):** Razorpay and PayPal fully eliminated; Stripe is the sole payment gateway.
- **Phase 2 (Centered Logo):** Logo is centered with pixel-level precision matching the reference screenshot.
- **Phase 3 & 4 (Demo Suite):** Complete idempotent seed suite with 16 books and 9 test accounts.
- **Phase 5 & 6 (Testing):** 45 of 45 API tests passed, 17 of 17 E2E journeys passed.
