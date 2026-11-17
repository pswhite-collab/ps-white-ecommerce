# Google Sign-In Audit and Fix Report

**Branch:** `fix/google-signin`  
**Date:** November 17, 2026  
**Scope:** Customer Google OAuth, Admin Google OAuth, Security & Configuration Hardening  

---

## 1. Defect Verification & Resolution Matrix (Defects A – J)

### Defect A: Missing `trust proxy` & Overly Strict Rate Limits
- **Status:** **CONFIRMED**
- **Evidence:** `backend/server.js` (line 33) never called `app.set('trust proxy', ...)`. In `backend/middleware/rateLimiter.js` (lines 10–29), `authLimiter` was set to 5 per 15 min and `oauthCallbackLimiter` to 10 per 5 min. Behind Vercel/reverse proxies, all clients shared a single proxy IP and were blocked globally.
- **Fix Summary:**
  1. Added `app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1))` before rate limiters in `server.js`.
  2. Relaxed limits to 20 requests per 15 min for initiation and 30 requests per 5 min for callbacks.
  3. Replaced raw JSON error handlers for browser navigations with redirects to `${CLIENT_URL}/login?error=rate_limited` or `/admin/login?error=rate_limited`.
- **Test Result:** **PASS** (`backend/tests/rateLimiter.test.js` — verified separate IP buckets for `X-Forwarded-For` and browser 302 redirect).

---

### Defect B: `CLIENT_URL` Treated as List in CORS but Single String in Redirects
- **Status:** **CONFIRMED**
- **Evidence:** `backend/server.js` (line 38) split `CLIENT_URL` on commas, but `backend/routes/auth.js` (line 40) and `adminAuthController.js` (line 16) executed `new URL(`${process.env.CLIENT_URL}/...`)`. When configured with multiple frontends (e.g. `https://www.ps-white.com,https://ps-white-ecommerce-rose.vercel.app`), `new URL()` threw `TypeError: Invalid URL`, crashing the backend after authentication.
- **Fix Summary:** Created `backend/config/clientUrl.js` exporting `getAllowedOrigins()`, `getPrimaryClientUrl()`, and `getClientUrlForOrigin()`. Safely strips trailing slashes, validates URL parsing, and returns valid origin.
- **Test Result:** **PASS** (`backend/tests/clientUrl.test.js` — verified parsing comma-separated URLs, trailing slashes, and fallback behavior).

---

### Defect C: Admin Google URL Built with Fragile String Replace
- **Status:** **CONFIRMED**
- **Evidence:** `frontend/src/pages/Admin/AdminLogin.jsx` (lines 30–32) executed `apiBase.replace('/api', '')`. If `apiBase` was `https://api.ps-white.com/api`, it replaced the substring inside `//api.` yielding `https:/.ps-white.com/api/api/admin/auth/google`.
- **Fix Summary:**
  1. Created `frontend/src/utils/apiConfig.js` using `new URL(apiBase, origin).origin`.
  2. In production builds, logged `console.error` and provided safe fallback instead of silently defaulting to `http://localhost:5000/api`.
  3. Updated `AdminLogin.jsx`, `Login.jsx`, `Register.jsx`, and `services/api.js`.
- **Test Result:** **PASS** (`backend/tests/apiConfig.test.js` — verified `https://api.ps-white.com/api`, `https://ps-white.com/api`, `http://localhost:5000/api`, and `/api`).

---

### Defect D: Missing Vercel SPA Rewrite (`vercel.json`)
- **Status:** **CONFIRMED**
- **Evidence:** Neither `vercel.json` nor `frontend/vercel.json` existed in the repository. Direct navigation or Google redirect to `/auth/google/success`, `/admin/login`, or `/books` returned HTTP 404 from Vercel's edge network.
- **Fix Summary:** Added `frontend/vercel.json` specifying rewrite `[{"source": "/(.*)", "destination": "/index.html"}]`.
- **Test Result:** **PASS** (`npm --prefix frontend run build` and route availability verified).

---

### Defect E: Callback URLs Silently Defaulting to `localhost`
- **Status:** **CONFIRMED**
- **Evidence:** `backend/config/passport.js` (lines 35–42) defaulted callback URLs to `http://localhost:5000/...` when environment variables were omitted. In production, this caused Google to reject requests with `Error 400: redirect_uri_mismatch` or redirect users to their local loopback.
- **Fix Summary:**
  1. Added fail-fast environment validator `backend/utils/checkEnv.js` and npm script `npm run check:env`.
  2. In `backend/server.js`, `startServer()` now validates required variables on production startup and exits with an actionable log if required keys or non-localhost URL requirements fail.
- **Test Result:** **PASS** (`backend/tests/googleAuthBackend.test.js:E.1` and `npm run check:env`).

---

### Defect F: Failures Showing Raw JSON or Generic Errors
- **Status:** **CONFIRMED**
- **Evidence:** `adminAuth.js` specified `failureRedirect: '/api/admin/auth/failed'`, rendering raw JSON `{ success: false, error: 'Google OAuth failed' }` on the backend. Customer failures all redirected with a single generic `?error=oauth_failed`.
- **Fix Summary:**
  1. Implemented Passport custom callbacks in `routes/auth.js` and `routes/adminAuth.js`.
  2. Mapped error codes: `oauth_failed`, `access_denied`, `registration_closed`, `account_disabled`, and `rate_limited`.
  3. Added user-friendly localized error display in `Login.jsx` and `AdminLogin.jsx`.
- **Test Result:** **PASS** (`e2e/journey10-google-auth.spec.js:10.4, 10.5` and `backend/tests/googleAuthBackend.test.js:F.1, F.2`).

---

### Defect G: Front-End Button Stuck / Over-Throttled
- **Status:** **CONFIRMED**
- **Evidence:** `Login.jsx` and `AdminLogin.jsx` set `oauthInProgress: true` upon click. When users clicked browser Back from Google's consent screen, bfcache restored the state with the button permanently disabled. Additionally, a 60-second cooldown in `localStorage` blocked immediate re-attempts.
- **Fix Summary:**
  1. Added `pageshow` event listener listening for `event.persisted` to reset `oauthInProgress: false`.
  2. Reduced client cooldown from 60 seconds to 5 seconds.
- **Test Result:** **PASS** (`e2e/journey10-google-auth.spec.js:10.6` — simulated `pageshow` with `persisted: true`).

---

### Defect H: JWT Token Passed in Query String
- **Status:** **CONFIRMED**
- **Evidence:** `routes/auth.js` and `adminAuthController.js` passed `redirectUrl.searchParams.set('token', token)`, exposing JWT tokens in URL query parameters, server logs, browser history, and HTTP `Referer` headers.
- **Fix Summary:**
  1. Updated OAuth callbacks to append `#token=<JWT>` in the URL hash fragment.
  2. Updated `GoogleAuthSuccess.jsx` and `AdminLogin.jsx` to read the token from fragment first, then immediately call `window.history.replaceState(null, '', window.location.pathname)` to strip the token from the address bar.
  3. Ensured `Referrer-Policy: no-referrer` in Helmet across production and development.
- **Test Result:** **PASS** (`e2e/journey10-google-auth.spec.js:10.1, 10.2` — verified token stripped from URL).

---

### Defect I: Account Pre-Hijacking via Google Linking
- **Status:** **CONFIRMED**
- **Evidence:** `config/passport.js` linked existing accounts by email even if `emailVerified === false`, leaving the attacker's pre-set password active on the now-verified account.
- **Fix Summary:** When linking a Google identity to an existing unverified account that has a password, the system unsets `password`, `passwordResetToken`, `passwordResetExpires`, and `emailVerificationToken`, and marks `emailVerified: true`.
- **Test Result:** **PASS** (`backend/tests/googleAuthBackend.test.js:I.1` — verified attacker password stripped upon linking).

---

### Defect J: Disabled User Access Control
- **Status:** **CONFIRMED**
- **Evidence:** `backend/models/User.js` lacked an `isActive` or `status` field.
- **Fix Summary:**
  1. Added `isActive: { type: Boolean, default: true, index: true }` to `User.js`.
  2. Added disabled user checks in `google-customer` and `google-admin` strategies, redirecting disabled accounts with `account_disabled`.
- **Test Result:** **PASS** (`backend/tests/googleAuthBackend.test.js:J.1, J.2`).

---

## 2. Test Suite Execution Summary

- **Unit Tests:** 20 / 20 PASSED (`clientUrl.test.js`, `rateLimiter.test.js`, `apiConfig.test.js`, `googleAuthBackend.test.js`).
- **Backend API Suite:** 45 / 45 PASSED (`npm run test:api`).
- **Playwright E2E Suite:** 23 / 23 PASSED (`npm run test:e2e` across Journeys 1–10).
- **Frontend Production Build:** PASSED (`npm --prefix frontend run build`).

---

## 3. What is BLOCKED and Why (Owner Action Required)

Live network OAuth round-trips with accounts.google.com cannot be simulated in automated CI/CD without real Google credentials and an active human browser interaction.

### Owner Manual Verification Steps:
1. **Configure Google Cloud Console:** Follow [`docs/GOOGLE_SIGNIN_SETUP.md`](docs/GOOGLE_SIGNIN_SETUP.md) to set **Authorized redirect URIs** and publish the consent screen to **In production**.
2. **Deploy Backend & Frontend Environment Variables:** Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CUSTOMER_CALLBACK_URL`, `GOOGLE_ADMIN_CALLBACK_URL`, and `VITE_API_URL` on host/Vercel.
3. **Manual Test 1 (New Customer):** Click "Sign in with Google" on `/login` with an unregistered Google account → Verify redirect to `/library` with account created.
4. **Manual Test 2 (Existing Customer):** Click "Sign in with Google" with an existing account → Verify instant login to `/library`.
5. **Manual Test 3 (Non-Whitelisted Admin):** Click "Sign in with Google" on `/admin/login` using an unauthorized email → Verify clean redirect to `/admin/login` showing: *"Access denied. Your Google account is not whitelisted for admin access."*
6. **Manual Test 4 (Whitelisted Admin):** Click "Sign in with Google" on `/admin/login` using `pswhite786@gmail.com` → Verify redirect to `/admin/dashboard`.

---

## 4. Executive Summary

All ten defects (A through J) have been identified, proven with automated tests, and resolved on branch `fix/google-signin`. Rate limiting and reverse proxy headers are now safely handled, multi-origin `CLIENT_URL` values no longer crash callback redirection, admin API URL parsing is resilient against subdomain names, Vercel SPA routes rewrite cleanly, and authentication tokens are delivered via hash fragments rather than query strings. Account pre-hijacking has been blocked by stripping unverified passwords during Google linking, and disabled users are rejected. The entire test suite of 45 backend API tests and 23 Playwright E2E journeys passes with zero regressions.
