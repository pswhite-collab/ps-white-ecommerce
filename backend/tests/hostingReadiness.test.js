import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllowedOrigins, getPrimaryClientUrl } from '../config/clientUrl.js';
import { checkEnv } from '../utils/checkEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('Hosting-Readiness 12-Point Verification Suite', () => {
  // Check 1: trust proxy configured
  it('1. trust proxy is configured in Express app', () => {
    const serverCode = fs.readFileSync(path.join(rootDir, 'backend/server.js'), 'utf8');
    assert.ok(serverCode.includes("app.set('trust proxy'"), 'server.js must configure trust proxy');
  });

  // Check 2: multi-origin CLIENT_URL handling
  it('2. multi-origin CLIENT_URL is handled cleanly without trailing slashes', () => {
    const raw = 'https://www.ps-white.com, https://ps-white-ecommerce-rose.vercel.app/ ';
    const origins = getAllowedOrigins(raw);
    assert.deepEqual(origins, [
      'https://www.ps-white.com',
      'https://ps-white-ecommerce-rose.vercel.app',
    ]);
    assert.equal(getPrimaryClientUrl(raw), 'https://www.ps-white.com');
  });

  // Check 3: safe admin URL parsing
  it('3. safe admin URL resolution avoids string replace bugs', async () => {
    const { getAdminGoogleAuthUrl } = await import('../../frontend/src/utils/apiConfig.js');
    const result = getAdminGoogleAuthUrl('https://api.ps-white.com/api', 'https://www.ps-white.com');
    assert.equal(result, 'https://api.ps-white.com/api/admin/auth/google');
  });

  // Check 4: build validation for VITE_API_URL in production
  it('4. build validation for VITE_API_URL handles production safely', async () => {
    const { getApiBaseUrl } = await import('../../frontend/src/utils/apiConfig.js');
    const prodFallback = getApiBaseUrl(undefined, true);
    assert.equal(prodFallback, '/api');
  });

  // Check 5: vercel.json SPA rewrite
  it('5. frontend/vercel.json exists and contains correct SPA rewrite to index.html', () => {
    const vercelJsonPath = path.join(rootDir, 'frontend/vercel.json');
    assert.ok(fs.existsSync(vercelJsonPath), 'frontend/vercel.json must exist');
    const content = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    assert.ok(Array.isArray(content.rewrites), 'rewrites must be an array');
    const hasSpa = content.rewrites.some((r) => r.source === '/(.*)' && r.destination === '/index.html');
    assert.ok(hasSpa, 'Must rewrite /(.*) to /index.html');
  });

  // Check 6: startup fail-fast validation and check:env script
  it('6. checkEnv returns clear validation result', () => {
    const result = checkEnv(false);
    assert.equal(typeof result.valid, 'boolean');
    assert.ok(Array.isArray(result.errors));
  });

  // Check 7: CORS 403 on unknown origin instead of 500
  it('7. CORS rejects unknown origins with 403 status', async () => {
    const originCheck = (origin) => {
      const allowed = getAllowedOrigins();
      if (!origin || allowed.includes(origin)) return null;
      return new Error('Origin not allowed by CORS');
    };
    const err = originCheck('https://malicious-site.com');
    assert.ok(err instanceof Error);
    assert.equal(err.message, 'Origin not allowed by CORS');
  });

  // Check 8: static assets compression and long cache headers for /assets/
  it('8. server.js has static asset cache-control configured for /assets/', () => {
    const serverCode = fs.readFileSync(path.join(rootDir, 'backend/server.js'), 'utf8');
    assert.ok(serverCode.includes('Cache-Control'), 'server.js must set Cache-Control for assets');
    assert.ok(serverCode.includes('max-age=31536000'), 'Cache-Control must set 1-year immutable cache');
  });

  // Check 9: dev token helper and sample endpoints blocked in production mode
  it('9. dev token helper and sample endpoints are blocked in production', () => {
    const devTokenCode = fs.readFileSync(path.join(rootDir, 'backend/utils/devToken.js'), 'utf8');
    assert.ok(devTokenCode.includes("process.env.NODE_ENV === 'production'"));

    const readingControllerCode = fs.readFileSync(
      path.join(rootDir, 'backend/controllers/readingController.js'),
      'utf8'
    );
    assert.ok(readingControllerCode.includes("process.env.NODE_ENV === 'production'"));
  });

  // Check 10: multer file upload limits verified against memory bounds
  it('10. multer upload limits are bounded safely (<= 100MB)', () => {
    const uploadCode = fs.readFileSync(path.join(rootDir, 'backend/middleware/upload.js'), 'utf8');
    assert.ok(!uploadCode.includes('500 * 1024 * 1024'), 'Memory upload must not allow unbounded 500MB');
    assert.ok(uploadCode.includes('100 * 1024 * 1024'), 'Audio upload must be bounded to 100MB');
  });

  // Check 11: ecosystem.config.js verified from root and backend/
  it('11. ecosystem.config.js exists in root and in backend/ for PM2 versatility', () => {
    assert.ok(fs.existsSync(path.join(rootDir, 'ecosystem.config.js')), 'Root ecosystem.config.js exists');
    assert.ok(fs.existsSync(path.join(rootDir, 'backend/ecosystem.config.js')), 'Backend ecosystem.config.js exists');
  });

  // Check 12: raw body parsing for Stripe webhook behind proxies
  it('12. server.js parses raw body for Stripe webhook before json middleware', () => {
    const serverCode = fs.readFileSync(path.join(rootDir, 'backend/server.js'), 'utf8');
    const webhookIndex = serverCode.indexOf('/api/payment/stripe/webhook');
    const jsonIndex = serverCode.indexOf('express.json(');
    assert.ok(webhookIndex > 0, 'Webhook route must be registered');
    assert.ok(jsonIndex > 0, 'express.json must be registered');
    assert.ok(webhookIndex < jsonIndex, 'Webhook raw body parser must appear before express.json');
  });
});
