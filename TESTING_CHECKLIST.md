# PS White E-Commerce - Manual Testing Checklist

Use this checklist during Day 4 and Day 5. Mark each item with `[x]` after validation.

## Authentication
- [ ] User can register with valid email/password
- [ ] Email verification link is sent (check Resend dashboard)
- [ ] User can login after verification
- [ ] User can logout
- [ ] Password reset flow works (forgot -> email -> reset)
- [ ] Invalid credentials show friendly error
- [ ] JWT token is stored in localStorage
- [ ] Protected routes redirect to `/login` when not authenticated

## Google OAuth Admin
- [ ] Only `pswhite786@gmail.com` can access admin
- [ ] Other Google accounts get access denied
- [ ] Admin token persists across page refresh
- [ ] Admin logout clears token/session

## Books
- [ ] Books listing loads all books
- [ ] Search works (`silence`, `mumbai`, etc.)
- [ ] Filters work (format, genre)
- [ ] Sort works (price, newest, rating)
- [ ] Pagination works when records > page size
- [ ] Book detail page loads correct data
- [ ] Format tags display correctly
- [ ] Price labels are correct across formats
- [ ] Ratings display correctly
- [ ] Add to cart works from list and detail pages

## eBook Reader
- [ ] Purchased books appear in My Library
- [ ] Continue Reading opens reader
- [ ] Reader loads EPUB/PDF content
- [ ] Navigation works (buttons and keyboard)
- [ ] Progress bar updates on page turns
- [ ] Page number display is accurate
- [ ] Bookmark add works
- [ ] Bookmark panel lists all saved bookmarks
- [ ] Bookmark delete works
- [ ] Reader settings (font/theme/spacing) apply correctly
- [ ] Theme changes apply immediately
- [ ] Reopen reader resumes progress
- [ ] Progress sync runs every ~30 seconds

## Shopping Cart
- [ ] Add to cart increments quantity for duplicate item+format
- [ ] Header cart badge updates
- [ ] Cart page shows items correctly
- [ ] Quantity update works
- [ ] Remove item works
- [ ] Cart persists on reload
- [ ] Summary totals are correct

## Checkout and Payment
- [ ] Checkout lists cart items
- [ ] Shipping form validates required fields
- [ ] Payment method selection works
- [ ] Razorpay test payment works
- [ ] Stripe test payment works
- [ ] Payment success creates order
- [ ] Confirmation email sent
- [ ] Digital product access granted after successful payment
- [ ] Order appears in order history

## Orders
- [ ] Order history shows user orders
- [ ] Order details show items/payment/shipping
- [ ] Download links work for digital products
- [ ] Admin can update order status

## Reviews
- [ ] User can create review only after purchase
- [ ] Review enters pending status initially
- [ ] Admin can approve review
- [ ] Approved review appears on book page
- [ ] Verified purchase badge shows correctly
- [ ] Helpful vote count updates

## Blog
- [ ] Blog listing shows all published posts
- [ ] Blog detail page renders full content
- [ ] Blog images load correctly
- [ ] Share actions work

## Newsletter
- [ ] Footer subscription form works
- [ ] Success message appears
- [ ] Email appears in subscribers list (admin)
- [ ] Unsubscribe endpoint works

## Admin Panel
- [ ] Dashboard cards show metrics
- [ ] Recent orders list shows current data
- [ ] Charts render without console errors
- [ ] Books table loads all books
- [ ] Add book form works
- [ ] Cover upload works
- [ ] EPUB/PDF upload works
- [ ] MP3 upload works
- [ ] Edit book works
- [ ] Soft delete book works
- [ ] Orders management works
- [ ] Customers list works
- [ ] Reading analytics page works
- [ ] Blog CRUD works
- [ ] Newsletter list works

## UI and UX
- [ ] Palette matches Milk/Oat/Taupe/Mocha/Charcoal
- [ ] Fonts load correctly
- [ ] Hover effects work on buttons/cards
- [ ] Loading states shown while fetching
- [ ] Error messages are clear
- [ ] Form validation messages are visible
- [ ] Mobile responsive at 375px / 768px / 1024px
- [ ] No browser console errors
- [ ] No major React warnings

## Performance and Quality
- [ ] Home page load < 2s on local broadband
- [ ] Reader load < 3s with sample file
- [ ] Images are lazy-loaded where applicable
- [ ] Lighthouse >= 85 performance
- [ ] Lighthouse >= 95 accessibility
- [ ] Lighthouse >= 90 best practices
- [ ] Lighthouse >= 90 SEO

