# PS White Demo Data Reference

This document describes the idempotent demo data suite seeded into the local MongoDB test database (`pswhite_local`).

---

## 1. Safety Guard

All seed and test utilities verify:
```javascript
const dbName = mongoose.connection.name;
if (!dbName.endsWith('_local') && !dbName.endsWith('_test')) {
  throw new Error('REFUSING TO SEED: Target database is not a _local or _test database!');
}
```
If the connection is pointed at any production or non-local database, the process aborts immediately.

---

## 2. Admin Persona

| Name | Email | Password | Role | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PS White (Admin)** | `pswhite786@gmail.com` | `Admin@12345` | `admin` | Whitelisted admin account; full dashboard, moderation, and catalog access. |

---

## 3. Customer Test Personas (9 Seeded Accounts)

All demo customer accounts share the default test password: **`Password@123`** (except `google_only` which authenticates via Google ID).

| Persona | Email | Orders / Role | Test Purpose |
| :--- | :--- | :--- | :--- |
| **Anika Menon** | `anika@example.com` | 1 completed order (`digital`), 2 books owned, 1 active reading progress, 1 approved 5-star review | E-reader progress, bookmarks, digital downloads, verified review submission. |
| **Rahul Verma** | `rahul@example.com` | 1 processing order (`physical`, tracking pending), 1 approved 4-star review | Physical order fulfillment, admin order status transitions. |
| **Maria Santos** | `maria@example.com` | 1 shipped order (`physical`), carrier: `FedEx`, tracking: `FDX794611234900` | Shipped order notifications, tracking link display, delivery tracking. |
| **David Miller** | `david@example.com` | 1 cancelled order (`Between Two Dawns`) | Cancelled order history display, refund handling verification. |
| **Isha Patel** | `isha@example.com` | 0 orders, 1 pending review (3 stars) | Review moderation in admin dashboard (approving / rejecting reviews). |
| **Nora Oders** | `no_orders@example.com` | 0 orders | Clean customer state; cart manipulation, checkout end-to-end tests. |
| **Sam Address** | `saved_address@example.com` | 1 processing physical order | Pre-saved shipping address autofill verification during checkout. |
| **Uma Unverified** | `unverified@example.com` | 0 orders, `emailVerified: false` | Unverified email notification and resend email verification test. |
| **Gabe GoogleOnly** | `google_only@example.com` | 0 orders, `isGoogleOnly: true` | Google OAuth account without local bcrypt password. |

---

## 4. Book Catalog Matrix (16 Seeded Books)

| Title | Formats Available | Stock Level | Price (USD) | Special Attributes / Test Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **The Weight of Silence** | eBook, Physical, Audiobook | 150 (Physical) | $14.99 / $24.99 / $19.99 | Featured; all 3 formats; 2 approved reviews; attached sample EPUB, PDF, and MP3. |
| **Between Two Dawns** | eBook, Physical, Audiobook | 120 (Physical) | $13.99 / $22.99 / $18.99 | Featured; all 3 formats; Mystery/Thriller genre. |
| **The Architecture of Rain** | eBook only | N/A | $12.99 | Featured; eBook only; no cover image provided (tests dynamic SVG gradient fallback). |
| **Voices Across the Water** | eBook only | N/A | $11.99 | Featured; eBook only; no cover image provided (tests dynamic SVG gradient fallback). |
| **Echoes from the Western Ghats** | Audiobook only | N/A | $19.99 | Non-featured; audiobook only; tests duration display and streaming player. |
| **Paper Lanterns in the Mist** | Physical only | 85 | $21.99 | Non-featured; physical only; requires physical shipping address at checkout. |
| **Shadows on the Verandah** | Physical only | 40 | $18.50 | Non-featured; physical only; SVG gradient fallback. |
| **The Last Boat to Cochin** | Physical only | **0** | $23.00 | **Out-of-stock edge case**: Stock 0; Add to Cart disabled; order creation rejected. |
| **Letters to an Absent River** | Physical only | **2** | $24.50 | **Low-stock edge case**: Stock 2; displays low stock warning; tests stock decrement. |
| **Dust and Monsoon** | eBook, Physical, Audiobook | 75 (Physical) | $10.99 / $20.00 / $16.00 | Multi-format bundle testing (digital + physical + audio). |
| **Chronicles of an Ancient Courtyard** | eBook only | N/A | $9.99 | Pure digital ebook under $10. |
| **A Map of Forgotten Monsoon Winds...** | eBook, Physical | 50 (Physical) | $15.99 / $29.99 | Long title / long description edge case; multi-format physical. |
| **The Silent Cartographer of Calicut** | eBook, Physical | 35 (Physical) | $12.50 / $21.00 | Mystery/Thriller genre; physical and ebook available. |
| **Under the Tamarind Canopy** | Physical only | 60 | $19.00 | Memoir/Essays; physical only. |
| **Midnight on Broadway** | Audiobook only | N/A | $17.50 | Jazz drama audio production; audiobook format testing. |
| **The Redacted Manuscripts of Fort Kochi** | eBook, Physical | 10 (Physical) | $9.99 / $15.00 | **Archived manuscript (`active: false`)**: 404 for guests; 200 for admins. |

---

## 5. Sample Media Files

Located in `backend/uploads/`:
- `sample-book.epub`: Fully valid Open Container Format EPUB with MIME type, `container.xml`, `content.opf`, and `chapter1.xhtml`.
- `sample-book.pdf` / `sample-preview.pdf`: Valid minimalist PDF document with PDF-1.4 header and text stream.
- `sample-audio.mp3`: Valid MP3 audio file with ID3v2 header and MPEG frame sync.

---

## 6. How to Run Seeds and Test Utilities

### Reset and Seed Clean Local Database
```bash
# Drops pswhite_local collections and applies seed
npm run seed:reset-local
```

### Apply Seed Idempotently (Safe to Run Repeatedly)
```bash
npm run seed:demo
```

### Generate Developer JWT Without Browser Sign-In
```bash
# Print a valid JWT for any test account
npm run dev-token anika@example.com
npm run dev-token pswhite786@gmail.com
```

### Run Automated Backend API Tests
```bash
npm run test:api
```
