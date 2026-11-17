# Google Sign-In Setup & Configuration Guide

This guide details the exact setup required to run Google Sign-In for both customers and administrators across local development and production deployments.

> **Security Note:** Never commit secrets (`GOOGLE_CLIENT_SECRET`, `JWT_SECRET`) to git or public documentation. Keep all credentials strictly in environment variables.

---

## 1. Google Cloud Console Configuration

Navigate to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).

### 1.1 Authorized Redirect URIs
Under your **OAuth 2.0 Client ID (Web Application)**, add the following exact URLs to **Authorized redirect URIs** (ensure exact protocol `https://` or `http://`, no trailing slashes):

| Environment | Purpose | Exact Authorized Redirect URI |
| :--- | :--- | :--- |
| **Production** | Customer Google Sign-In | `https://<BACKEND_HOST>/api/auth/google/callback` |
| **Production** | Admin Google Sign-In | `https://<BACKEND_HOST>/api/admin/auth/google/callback` |
| **Local Development** | Customer Google Sign-In | `http://localhost:5000/api/auth/google/callback` |
| **Local Development** | Admin Google Sign-In | `http://localhost:5000/api/admin/auth/google/callback` |

*(Note: "Authorized JavaScript origins" are not required because Google authenticates via server-side redirect).*

### 1.2 OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**.
2. **Publishing Status:** Must be set to **In production** (or "Published").
   - *Warning:* If left in **Testing**, only explicitly listed test Google accounts can sign in. All other users will receive `access_denied`.
3. **Scopes:** Ensure `.../auth/userinfo.email` and `.../auth/userinfo.profile` are added.
4. **App Information:** Add support email and authorized domain (e.g. `ps-white.com`).

---

## 2. Environment Variables Checklist

### 2.1 Backend Server Environment (`backend/.env`)
Set these environment variables on your backend host (e.g. Render, Railway, VPS, or local):

```env
# Node Environment
NODE_ENV=production
PORT=5000

# Client Origins (supports comma-separated list of frontends)
CLIENT_URL=https://www.ps-white.com,https://ps-white-ecommerce-rose.vercel.app

# Trust Proxy (1 for single reverse proxy e.g. Vercel/Nginx/Render, true for multiple)
TRUST_PROXY=1

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CUSTOMER_CALLBACK_URL=https://<BACKEND_HOST>/api/auth/google/callback
GOOGLE_ADMIN_CALLBACK_URL=https://<BACKEND_HOST>/api/admin/auth/google/callback

# Admin Access Whitelist
ADMIN_WHITELIST_EMAIL=pswhite786@gmail.com

# Authentication Secrets
JWT_SECRET=your_minimum_32_character_jwt_secret
```

> **Verification:** Run `npm run check:env` on the backend host to confirm all required variables are set before starting the server.

### 2.2 Frontend Environment (`frontend/.env` on Vercel)
Set in the **Vercel Project Settings** → **Environment Variables**:

```env
VITE_API_URL=https://<BACKEND_HOST>/api
```

> **Important:** Always trigger a **redeploy** on Vercel after changing `VITE_API_URL`, because Vite bakes `import.meta.env` values into the compiled JavaScript bundle at build time.

---

## 3. Symptom to Cause Troubleshooting Matrix

| Observed Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **Error 400: `redirect_uri_mismatch`** | The callback URL sent by backend doesn't match Google Console. | Check `GOOGLE_CUSTOMER_CALLBACK_URL` and `GOOGLE_ADMIN_CALLBACK_URL` match Google Console **character-for-character** (including `https` and no trailing slash). |
| **`access_denied` / "App not verified"** | OAuth consent screen is in "Testing" mode or user is not whitelisted. | Set OAuth consent screen to **In production** in Google Console. For admin sign-in, ensure email matches `ADMIN_WHITELIST_EMAIL` or `AdminWhitelist` collection. |
| **Vercel 404 after successful login** | Missing SPA route rewrite rule on Vercel. | Verify `frontend/vercel.json` exists with rewrite rule `[{"source": "/(.*)", "destination": "/index.html"}]`. |
| **"Too many requests" / 429 error** | Rate limiter proxy IP collision (`trust proxy` missing). | Fixed: `TRUST_PROXY=1` enabled on server; rate limits relaxed to 20 per 15 min (auth) and 30 per 5 min (callback). |
| **Raw JSON error page on backend** | Passport callback lacked frontend error redirect. | Fixed: Custom callbacks now redirect to `/login?error=...` or `/admin/login?error=...` with user-friendly messages. |
| **Admin login button navigates to invalid URL** | Fragile `.replace('/api', '')` clobbered domain name. | Fixed: URL parsing now uses `new URL(apiBase, origin).origin`. |
| **Works locally but fails on production** | Callback URLs or `CLIENT_URL` point to `localhost`. | Ensure production environment variables specify production domain names, not localhost. |
