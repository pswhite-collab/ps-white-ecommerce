# PS White E-Commerce - API Documentation

Base URL (local): `http://localhost:5000/api`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/verify-email/:token`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me` (protected)
- `PUT /auth/me` (protected)

## Admin Auth
- `GET /admin/auth/google`
- `GET /admin/auth/google/callback`
- `POST /admin/auth/verify-admin`
- `GET /admin/auth/me` (admin)
- `POST /admin/auth/logout` (admin)

## Books
- `GET /books`
- `GET /books/featured`
- `GET /books/search?q=...`
- `GET /books/:id`
- `POST /books` (admin)
- `PUT /books/:id` (admin)
- `DELETE /books/:id` (admin, soft delete)
- `POST /books/:id/upload-cover` (admin, multipart)
- `POST /books/:id/upload-ebook` (admin, multipart)
- `POST /books/:id/upload-audio` (admin, multipart)
- `DELETE /books/:id/files/:fileType` (admin)

## Reading and Reader
- `GET /reading/library` (protected)
- `GET /reading/stats` (protected)
- `GET /reading/currently-reading` (protected)
- `GET /reading/progress/:bookId` (protected)
- `POST /reading/progress/:bookId` (protected)
- `PUT /reading/progress/:bookId/page` (protected)
- `POST /reading/progress/:bookId/bookmark` (protected)
- `DELETE /reading/progress/:bookId/bookmark/:bookmarkId` (protected)
- `PUT /reading/progress/:bookId/settings` (protected)
- `POST /reading/progress/:bookId/complete` (protected)
- `GET /reader/:bookId/content` (protected)
- `GET /reader/:bookId/preview`
- `GET /reader/:bookId/metadata` (protected)

## Orders and Payments
- `POST /orders` (protected)
- `GET /orders` (protected)
- `GET /orders/all` (admin)
- `GET /orders/:id` (protected)
- `PUT /orders/:id/status` (admin)
- `POST /orders/:id/refund` (admin)
- `POST /payment/razorpay/create-order` (protected)
- `POST /payment/razorpay/verify` (protected)
- `POST /payment/stripe/create-intent` (protected)
- `POST /payment/stripe/confirm` (protected)
- `POST /payment/stripe/webhook`
- `POST /payment/paypal/create-order` (protected)
- `POST /payment/paypal/capture` (protected)

## Reviews
- `GET /reviews/book/:bookId`
- `POST /reviews` (protected)
- `PUT /reviews/:id` (protected)
- `DELETE /reviews/:id` (protected/admin)
- `PUT /reviews/:id/approve` (admin)
- `POST /reviews/:id/helpful` (protected)

## Blog
- `GET /blog/posts`
- `GET /blog/posts/:slug`
- `POST /blog/posts` (admin)
- `PUT /blog/posts/:id` (admin)
- `DELETE /blog/posts/:id` (admin)
- `POST /blog/posts/:id/comments` (protected)

## Newsletter
- `POST /newsletter/subscribe`
- `POST /newsletter/unsubscribe`
- `GET /newsletter/subscribers` (admin)

## Admin Dashboard
- `GET /admin/dashboard` (admin)
- `GET /admin/dashboard/stats` (admin)
- `GET /admin/dashboard/reading-stats` (admin)
- `GET /admin/orders` (admin)
- `GET /admin/customers` (admin)
- `GET /admin/customers/:id` (admin)
- `GET /admin/customers/:id/reading` (admin)
- `GET /admin/analytics` (admin)
- `GET /admin/reading-analytics` (admin)

## Utility
- `GET /test`
- `GET /health`

## Security Notes
- `GET /reader/:bookId/content` is rate-limited per user/book (default `5` requests per day).
- Reader content responses include signed URL expiry metadata (`expiresAt`) for secure file access handling.
- Reader content responses include `security.watermarkText` for in-reader dynamic watermark overlays.
- `GET /reader/:bookId/preview` returns chapter-style preview payload:
  - `preview` (plain text)
  - `previewDetails` (`title`, `content`, `truncated`, `chapterCountDetected`, `wordCount`, `estimatedReadMinutes`)

## Admin Orders Query Params
- `status`: filter by order status
- `search`: order number or guest email
- `date_from`: start date (`YYYY-MM-DD`)
- `date_to`: end date (`YYYY-MM-DD`)
- `page`, `limit`: pagination controls

## Response Contract
Success response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "error": "Human readable error message"
}
```
