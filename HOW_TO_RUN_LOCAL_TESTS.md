# How to Run Local Tests

This document provides quick, single-line commands to run the test suite and verify the PS White e-commerce application locally.

---

## 1. Prerequisites

1. **MongoDB**: Local MongoDB instance running on `localhost:27017`.
2. **Node.js**: Node 18+ (verified on Node 22).
3. **Environment Files**:
   - `backend/.env.local-test`: Configured with `APP_ENV=local-test`, `MONGODB_URI=mongodb://localhost:27017/pswhite_local`, `STRIPE_SECRET_KEY=sk_test_...`.
   - `frontend/.env.local`: Configured with `VITE_API_URL=http://localhost:5000/api`, `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`.

> **Safety Assurance**: Every seed and test script verifies that the database name ends with `_local` or `_test`. If pointed at production or Atlas, the process terminates immediately.

---

## 2. Quick Command Reference

All commands can be executed from the **repository root**:

| Action | Command | Description |
| :--- | :--- | :--- |
| **Seed Demo Data** | `npm run seed:demo` | Seeds 16 books (all formats, low/zero stock, free, archived), 9 customer personas, orders, reviews, quotes, and settings idempotently into `pswhite_local`. |
| **Reset Database** | `npm run seed:reset-local` | Drops `pswhite_local` (with safety guard confirmation) and performs a clean seed. |
| **Run API Tests** | `npm run test:api` | Runs the 45 backend integration and security test cases via Node's native test runner (`node --test`). |
| **Run E2E Journeys** | `npm run test:e2e` | Starts backend and frontend web servers and runs all 17 Playwright end-to-end tests across 9 user journeys. |
| **Generate Dev Token** | `npm run dev-token -- <email>` | Generates a valid signed JWT for any seeded persona (e.g., `anika@example.com` or `pswhite786@gmail.com`). |
| **Build Frontend** | `npm --prefix frontend run build` | Compiles the production Vite bundle and validates TypeScript/JSX syntax and Tailwind styles. |
| **Syntax Check** | `npm run dev` (in `backend/`) | Validates all backend JavaScript modules with `node --check`. |

---

## 3. Step-by-Step Execution Guide

### Step 3.1: Seed Database
```powershell
npm run seed:demo
```
*Expected Output:*
```text
Connected to database for seed: pswhite_local
Seed completed successfully.
- Database: pswhite_local
- Admin: pswhite786@gmail.com
- Books available: 16
- Customer test users: 9
```

### Step 3.2: Run Backend API Test Suite
```powershell
npm run test:api
```
*Expected Output:*
```text
✔ Backend API Test Suite (pswhite_local)
ℹ tests 45
ℹ suites 11
ℹ pass 45
ℹ fail 0
```

### Step 3.3: Run Playwright E2E Test Suite
```powershell
npm run test:e2e
```
*Expected Output:*
```text
Running 17 tests using 1 worker
  ok  1 [chromium] › e2e\journey1-guest-browsing.spec.js ...
  ...
  ok 17 [chromium] › e2e\journey9-accessibility.spec.js ...

  17 passed (44.2s)
```

---

## 4. Test Personas

For detailed credentials and book catalog listings, refer to [`docs/DEMO_DATA.md`](docs/DEMO_DATA.md).

- **Admin Account**: `pswhite786@gmail.com` / `Admin@12345`
- **Customer Account (eReader & Digital)**: `anika@example.com` / `Password@123`
- **Customer Account (Physical Order)**: `rahul@example.com` / `Password@123`
- **Customer Account (Shipped FedEx)**: `maria@example.com` / `Password@123`
