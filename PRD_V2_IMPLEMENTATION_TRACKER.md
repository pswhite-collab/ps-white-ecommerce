# PRD v2.0 Implementation Tracker

Date: 2026-03-22  
Scope: Align codebase with PRD v2 endpoint contracts and admin analytics requirements.

## Completed in this batch
- [x] Added PRD-compliant admin stats endpoint alias: `GET /api/admin/dashboard/stats`
- [x] Added PRD-compliant admin reading stats endpoint: `GET /api/admin/dashboard/reading-stats`
- [x] Added customer detail endpoint: `GET /api/admin/customers/:id`
- [x] Added customer reading endpoint: `GET /api/admin/customers/:id/reading`
- [x] Added admin analytics endpoint: `GET /api/admin/analytics`
- [x] Added admin orders endpoint alias: `GET /api/orders/all`
- [x] Upgraded admin analytics payload (sales + reading summary + most-read titles)
- [x] Updated frontend admin service to consume PRD v2 endpoint contracts
- [x] Updated API documentation with new routes
- [x] Reader hardening: download rate limiting (5/day default), signed URL expiry metadata, security payload hints
- [x] Upload hardening: strict magic-byte validation + MIME enforcement + safer Cloudinary replace/delete handling
- [x] Added PayPal backend endpoints: create + capture (`/api/payment/paypal/*`) with simulation fallback
- [x] Added PayPal option in Checkout UI and frontend payment service
- [x] Upgraded Admin Customers UI with search + detail modal + reading progress panel
- [x] Updated Admin Reading Analytics UI to align with backend payload fields (titles, progress, time, completion)
- [x] Added admin orders filters + pagination wiring (status/search/date) via `/api/admin/orders`
- [x] Added chapter-style preview payloads to `/api/reader/:bookId/preview` with truncation + reading-time metadata
- [x] Added in-reader anti-piracy watermark overlay (EPUB/PDF) using secure watermark text from backend

## Next recommended batch (high impact)
- [ ] Reader hardening follow-up: server-side PDF watermark file generation before delivery (currently dynamic UI overlay)
- [ ] PRD-to-code parity audit for route names and response shapes

## Validation done
- [x] Syntax checks passed for modified backend route/controller files
- [x] Syntax checks passed for modified frontend service/page files (code-level)
- [x] Frontend production build passes (`vite build`) in unrestricted environment
