# Route & Link Inventory

This inventory documents every client route, navigation link, access level, component, and backend data dependencies across the PS White application.

## 1. Public Customer Routes

| Route | Access Level | Component | Data / API Dependencies | Description |
|---|---|---|---|---|
| `/` | Public | `Home.jsx` | `GET /api/books`, `GET /api/quotes/daily`, `POST /api/newsletter/subscribe` | Storefront landing page, hero, featured titles, daily quote banner, author intro, newsletter signup. |
| `/books` | Public | `Books.jsx` | `GET /api/books?format=&sort=&search=&page=&limit=` | Filterable, searchable book catalog with format selection, sorting, and pagination. |
| `/books/:id` | Public | `BookDetail.jsx` | `GET /api/books/:id`, `GET /api/reviews/book/:id`, `POST /api/reviews` | Single book presentation, format toggle (eBook, Paperback, Hardcover), sample reader modal, reviews, add to cart. |
| `/blog` | Public | `Blog.jsx` | `GET /api/blog/posts` | Editorial articles, literary essays, announcements. |
| `/blog/:slug` | Public | `BlogPost.jsx` | `GET /api/blog/posts/:slug` | Single blog article view with full prose body and publication date. |
| `/login` | Public (Guest) | `Login.jsx` | `POST /api/auth/login`, `GET /api/auth/google` | Customer account authentication with email/password and Google OAuth. |
| `/register` | Public (Guest) | `Register.jsx` | `POST /api/auth/register`, `GET /api/settings` | Customer self-registration (subject to `allowRegistration` toggle). |
| `/auth/google/success` | Public | `GoogleAuthSuccess.jsx` | Query parameter `?token=...` | Post-OAuth redirect landing component that extracts JWT and updates AuthContext. |
| `/cart` | Public | `Cart.jsx` | Local storage `pswhite_cart` | Shopping cart view with item list, quantity modification, and checkout trigger. |
| `/#about` | Public | `Home.jsx` (`#about`) | In-page anchor | Smooth scrolls to the Author About section on the home page. |

---

## 2. Protected Customer Routes

| Route | Access Level | Component | Data / API Dependencies | Description |
|---|---|---|---|---|
| `/checkout` | Authenticated Customer | `Checkout.jsx` | `POST /api/orders` (Stripe PaymentIntent), Stripe Elements | 3-step checkout: Review items, shipping address form, Stripe card payment. |
| `/order-success/:orderId` | Authenticated Customer | `OrderSuccess.jsx` | `GET /api/orders/:orderId` | Post-payment confirmation with order breakdown, items, and shipping status. |
| `/library` | Authenticated Customer | `Library.jsx` | `GET /api/library` | Digital bookcase for customer-owned eBooks and audiobooks. |
| `/reader/:bookId` | Authenticated Customer | `Reader.jsx` | `GET /api/library`, `GET/PUT /api/library/:id/progress` | Interactive in-browser reader for purchased digital titles with bookmarking and progress tracking. |

---

## 3. Admin Routes (Protected - Role: admin / super_admin)

| Route | Access Level | Component | Data / API Dependencies | Description |
|---|---|---|---|---|
| `/admin/login` | Public / Admin Guest | `AdminLogin.jsx` | `POST /api/admin/auth/login`, `GET /api/admin/auth/google` | Admin portal login with email/password and Google OAuth (whitelist-restricted). |
| `/admin/dashboard` | Admin | `AdminDashboard.jsx` | `GET /api/admin/dashboard` | Executive KPIs: revenue, orders, customers, book stats, recent orders. |
| `/admin/manage-books` | Admin | `ManageBooks.jsx` | `GET/POST/PUT/DELETE /api/books`, Cloudinary uploads | Catalog management, book editor, pricing, stock levels, file attachments. |
| `/admin/orders` | Admin | `ManageOrders.jsx` | `GET/PATCH /api/admin/orders` | Order fulfillment pipeline, payment tracking, shipping updates. |
| `/admin/customers` | Admin | `Customers.jsx` | `GET /api/admin/customers` | Customer directory, spending history, order counts, status toggles. |
| `/admin/reading-analytics` | Admin | `ReadingAnalytics.jsx` | `GET /api/admin/reading-analytics` | Reader telemetry, session durations, completion rates. |
| `/admin/quotes` | Admin | `ManageQuotes.jsx` | `GET/POST/PUT/DELETE /api/quotes` | Curated literary quotes and daily quote selection. |
| `/admin/reviews` | Admin | `ManageReviews.jsx` | `GET /api/reviews`, `PATCH /api/reviews/:id/status` | Community review moderation (pending, approved, rejected). |
| `/admin/blog` | Admin | `ManageBlog.jsx` | `GET/POST/PUT/DELETE /api/blog` | Blog CMS: post creation, Markdown editing, draft/published status. |
| `/admin/newsletter` | Admin | `ManageNewsletter.jsx` | `GET /api/admin/newsletter`, `POST /api/admin/newsletter/send` | Subscriber list management and newsletter campaign dispatch. |
| `/admin/settings` | Admin | `Settings.jsx` | `GET/PUT /api/settings` | Store configuration: maintenance mode, registration toggle, currency, shipping rates. |

---

## 4. Fallback Routes

| Route | Behavior |
|---|---|
| `/admin/*` | Redirects to `/admin/dashboard` (if admin) or `/admin/login` |
| `*` | Catch-all redirects to `/` |

---

## 5. Navigation Links Reference

### Header Navigation
- **Desktop Nav**:
  - `Books` -> `/books`
  - `Blog` -> `/blog`
  - `About` -> `/#about`
  - `Logo ("PS White")` -> `/`
  - `Cart` (with badge) -> `/cart`
  - `Login` -> `/login` (logged out)
  - `Sign Up` -> `/register` (logged out)
  - `Account Dropdown` -> `/library`, `/admin/dashboard` (if admin), `Logout`
- **Mobile Menu**:
  - `Books` -> `/books`
  - `Blog` -> `/blog`
  - `About` -> `/#about`
  - `Cart` -> `/cart`
  - `Login` / `Sign Up` or `My Library` / `Logout`

### Footer Navigation
- **Books Column**:
  - `The Weight of Silence` -> `/books`
  - `Between Two Dawns` -> `/books`
  - `A Garden of Echoes` -> `/books`
  - `Letters to the Unsent` -> `/books`
  - `All Books` -> `/books`
- **Shop Column**:
  - `eBooks` -> `/books`
  - `Physical Books` -> `/books`
  - `Audiobooks` -> `/books`
  - `Signed Copies` -> `/books`
  - `Gift Cards` -> `/books`
- **Info Column**:
  - `About PS White` -> `/#about`
  - `Blog` -> `/blog`
  - `Events` -> `/blog`
  - `Privacy Policy` -> `/privacy` (redirects to `/`)
  - `Terms` -> `/terms` (redirects to `/`)
- **External Links**:
  - `ZERO` -> `https://zeroops.in` (target="_blank", rel="noopener noreferrer")
  - Social Links: `IG`, `X`, `FB`, `TT`, `GR` (`#`)

### Admin Sidebar Navigation
- `Dashboard` -> `/admin/dashboard`
- `Orders` -> `/admin/orders`
- `Books` -> `/admin/manage-books`
- `Customers` -> `/admin/customers`
- `Reading Analytics` -> `/admin/reading-analytics`
- `Quote of the Day` -> `/admin/quotes`
- `Reviews` -> `/admin/reviews`
- `Blog` -> `/admin/blog`
- `Newsletter` -> `/admin/newsletter`
- `Settings` -> `/admin/settings`
