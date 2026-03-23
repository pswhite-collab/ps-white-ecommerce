# PS White E-Commerce - Admin Guide

## Access Requirements
- Admin uses Google OAuth
- Email must be in `AdminWhitelist`
- Primary admin: `pswhite786@gmail.com`

## Admin Workflow

### 1. Dashboard
- View total orders, revenue, customers
- Review recent order activity
- Track reading analytics highlights

### 2. Books Management
- Create new books with format pricing
- Upload:
  - Cover image
  - EPUB/PDF files
  - MP3 audiobook
- Toggle featured and active states
- Soft delete books when needed

### 3. Orders Management
- Review incoming orders
- Update status flow:
  - `pending` -> `processing` -> `shipped` -> `delivered`
- Mark completed digital orders after payment confirmation
- Initiate refunds when required

### 4. Customers
- Search customers by name/email
- Inspect purchase history and reading behavior

### 5. Reviews
- Approve or reject pending reviews
- Verify abuse/spam before approval

### 6. Blog and Newsletter
- Publish and update blog posts
- Review newsletter subscribers

## Security Rules
- Never share admin token
- Logout after admin session
- Keep `.env` secrets private
- Rotate keys when team changes

