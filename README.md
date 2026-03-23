# PS White - Author E-Commerce Website

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Storage**: Cloudinary
- **Email**: Resend
- **Payments**: Razorpay + Stripe
- **OAuth**: Google OAuth 2.0

## Features
- E-commerce (eBooks, physical books, audiobooks)
- Built-in eBook reader (EPUB + PDF support)
- Reading progress tracking with bookmarks
- Google OAuth admin access
- Payment integration (India + International)
- Email notifications

## Setup Instructions

### Quick Start (Run Both Servers Together)
1. `cd ps-white-ecommerce`
2. `npm install`
3. `npm run dev`

This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`
- Health check: `http://localhost:5000/health`
- API test: `http://localhost:5000/api/test`

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Razorpay account
- Stripe account
- Resend account
- Google OAuth credentials

### Backend Setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in credentials
4. `npm run dev` (starts on port 5000)

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in API URL
4. `npm run dev` (starts on port 5173)

### Database Seed (Day 2)
Populate test data:

1. `cd backend`
2. `npm run seed`

This seeds:
- Admin user + whitelist
- 8 books
- Review data
- Blog posts
- Customer test users

## Project Structure
- `/backend` - Node.js API server
- `/frontend` - React SPA application

## Timeline
- Day 1: Setup & Foundation
- Day 2-3: Build Core Features (in progress)
- Day 4-5: Testing, Deployment, Polish (in progress)

## Day 4-5 Docs
- `TESTING_CHECKLIST.md`
- `BUG_TRACKER.md`
- `USER_GUIDE.md`
- `ADMIN_GUIDE.md`
- `API_DOCUMENTATION.md`
- `DEPLOYMENT_GUIDE.md`
- `MAINTENANCE_GUIDE.md`

## Developer
Built with Cursor AI for PS White
