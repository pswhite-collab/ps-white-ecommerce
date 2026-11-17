import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import { authLimiter, oauthCallbackLimiter } from '../middleware/rateLimiter.js';

describe('A. Rate Limiter and Trust Proxy', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.set('trust proxy', 1);

    app.get('/test-auth', authLimiter, (req, res) => {
      res.json({ success: true, ip: req.ip });
    });

    app.get('/test-admin-auth', authLimiter, (req, res) => {
      res.json({ success: true, ip: req.ip });
    });

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('A.1 Multiple distinct users (different X-Forwarded-For) are not grouped into a single IP bucket', async () => {
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${baseUrl}/test-auth`, {
        headers: {
          'X-Forwarded-For': `198.51.100.${i}`,
          Accept: 'application/json',
        },
      });
      assert.equal(res.status, 200, `User ${i} should not be blocked`);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.ip, `198.51.100.${i}`);
    }
  });

  it('A.2 Single IP exceeding limit is rate-limited: API returns 429 JSON', async () => {
    const ip = '203.0.113.42';
    // Send 20 requests (under the 20 limit)
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${baseUrl}/test-auth`, {
        headers: {
          'X-Forwarded-For': ip,
          Accept: 'application/json',
        },
      });
      assert.equal(res.status, 200);
    }

    // 21st request should be rate-limited
    const limitedRes = await fetch(`${baseUrl}/test-auth`, {
      headers: {
        'X-Forwarded-For': ip,
        Accept: 'application/json',
      },
    });
    assert.equal(limitedRes.status, 429);
    const body = await limitedRes.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'rate_limited');
  });

  it('A.3 Browser navigation exceeding limit redirects to frontend with ?error=rate_limited instead of raw JSON', async () => {
    const ip = '203.0.113.99';
    // Exhaust limit
    for (let i = 0; i < 20; i++) {
      await fetch(`${baseUrl}/test-auth`, {
        headers: { 'X-Forwarded-For': ip, Accept: 'text/html' },
        redirect: 'manual',
      });
    }

    // Next request from browser receives redirect (302)
    const browserRes = await fetch(`${baseUrl}/test-auth`, {
      headers: {
        'X-Forwarded-For': ip,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
      },
      redirect: 'manual',
    });

    assert.equal(browserRes.status, 302);
    const location = browserRes.headers.get('location');
    assert.ok(location.includes('/login?error=rate_limited'));
  });
});
