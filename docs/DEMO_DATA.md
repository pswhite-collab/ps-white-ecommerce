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
| **PS White (Admin)** | `pswhite786@gmail.com` | `Admin@12345` | `admin` | Whitelisted admin account; full dashboard and catalog access. |

---

## 3. Customer Test Personas

All demo customer accounts share the default test password: **`Password@123`**

| Persona | Email | Orders / Role | Test Purpose |
| :--- | :--- | :--- | :--- |
| **Anika Sharma** | `anika@example.com` | 1 completed order (`digital`), 2 books owned, 1 active reading progress, 1 approved 5-star review | E-reader progress, bookmarks, digital downloads, verified review submission. |
| **Rahul Patel** | `rahul@example.com` | 1 processing order (`physical`, tracking pending), 1 approved 4-star review | Physical order fulfillment, admin order status transitions. |
| **Priya Nair** | `priya@example.com` | 1 shipped order (`mixed`: ebook + hardcover), carrier: `USPS`, tracking: `USPS9400100000000000000001` | Shipped order notifications, tracking link display, mixed format cart. |
| **David Miller** | `david@example.com` | 1 cancelled order (`Between Two Dawns`) | Cancelled order history display, refund handling verification. |
| **Elena Rostova** | `elena@example.com` | 1 pending unpaid order (`Whispers in the Mist`) | Incomplete checkout resumption, unpaid order expiration. |
| **Marcus Vance** | `marcus@example.com` | 0 orders | Clean customer state; cart manipulation, checkout end-to-end tests. |
| **Sophia Chen** | `sophia@example.com` | 0 orders | Profile updating, password reset flow, registration verification. |
| **Arjun Mehta** | `arjun@example.com` | 0 orders | Audiobook streaming/preview tests and media controls. |
| **Isha Gupta** | `isha@example.com` | 0 orders, 1 pending review (3 stars) | Review moderation in admin dashboard (approving / rejecting reviews). |

---

## 4. Book Catalog Matrix (16 Seeded Books)

| Title | Formats Available | Stock Level | Price (USD) | Special Attributes / Test Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **The Weight of Silence** | eBook, Physical, Audiobook | 150 (Physical) | $14.99 / $24.99 / $19.99 | Featured; all 3 formats; has 2 approved reviews (avg 4.5); attached sample EPUB, PDF, and MP3 files. |
| **Between Two Dawns** | eBook, Physical, Audiobook | 120 (Physical) | $13.99 / $22.99 / $18.99 | Featured; all 3 formats; Thriller genre. |
| **The Architecture of Rain** | eBook only | N/A | $12.99 | Featured; eBook only; no cover image provided (tests dynamic SVG gradient fallback). |
| **Voices Across the Water** | eBook only | N/A | $9.99 | Featured; eBook only; no cover image provided (tests dynamic SVG gradient fallback). |
| **The Cartographer's Shadow** | Physical only | 80 | $21.99 | Non-featured; physical only; requires physical shipping address at checkout. |
| **Echoes of Old Stone** | Physical only | 65 | $19.99 | Non-featured; physical only. |
| **Midnight Monologues** | Audiobook only | N/A | $15.99 | Non-featured; audiobook only; tests duration display and streaming player. |
| **Solitary Currents** | Audiobook only | N/A | $16.99 | Non-featured; audiobook only. |
| **Letters to an Unnamed City** | eBook, Physical | 95 (Physical) | $11.99 / $20.99 | Multi-format bundle testing (digital + physical). |
| **Tides of Memory** | Physical, Audiobook | 40 (Physical) | $23.99 / $17.99 | Physical + Audiobook only (no ebook). |
| **The Silent Weaver** | eBook, Audiobook | N/A | $10.99 / $14.99 | Pure digital combo (ebook + audiobook). |
| **Zero Stock Hardcover** | Physical only | **0** | $29.99 | **Out-of-stock edge case**: Add to Cart must be disabled / reject checkout. |
| **Low Stock Collector's Edition**| Physical only | **2** | $39.99 | **Low-stock edge case**: Displays low stock warning; tests stock decrement. |
| **Complimentary Essay Collection**| eBook only | N/A | **$0.00** | **Free product edge case**: Tests $0 digital checkout. |
| **Collector's Archive Edition** | Physical only | 15 | **$49.99** | **High-price item**: Automatically triggers free shipping (threshold = $45). |
| **Archived Manuscript** | eBook only | N/A | $8.99 | **Inactive book (`active: false`)**: Hidden from catalog; direct URL returns 404 for guests. |

---

## 5. Sample Media Files

Located in `backend/uploads/`:
- `sample-book.epub`: Fully valid Open Container Format EPUB with MIME type, `container.xml`, `content.opf`, and `chapter1.xhtml`.
- `sample-preview.pdf`: Valid minimalist PDF document with PDF-1.4 header and text stream.
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
