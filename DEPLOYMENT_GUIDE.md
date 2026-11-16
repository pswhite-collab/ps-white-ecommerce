# PS White E-Commerce - Deployment Guide (Hostinger)

## 1. Build Frontend
```bash
cd frontend
npm install
npm run build
```

Generated output: `frontend/dist`

## 2. Prepare Backend
```bash
cd backend
npm install --production
```

Create `backend/.env` from `backend/.env.production.example`.

## 3. Hostinger Node App Setup
1. Open Hostinger panel
2. Go to Advanced -> Setup Node.js App
3. Choose Node.js 18+
4. App root: backend folder path on server
5. Startup file: `server.js`

## 4. Upload Files
- Upload backend source to Node app root
- Upload `frontend/dist` contents to public web root

## 5. PM2 Process Manager
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
pm2 status
```

## 6. Reverse Proxy (if backend runs on :5000)
Proxy `/api` to backend port and keep SPA fallback to `/index.html`.

## 7. SSL
Enable SSL in Hostinger and force HTTPS.

## 8. Post-Deploy Checks
- `GET /health` returns status OK
- Frontend loads with no console errors
- Auth, books, checkout, and reader flows all pass
- Admin login works only for whitelisted email

## 9. Rollback Plan
1. Keep previous release backup
2. Restore previous frontend `dist`
3. Revert backend to previous commit
4. `pm2 restart ps-white-backend`

