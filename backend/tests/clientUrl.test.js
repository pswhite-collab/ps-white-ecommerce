import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllowedOrigins,
  getPrimaryClientUrl,
  getClientUrlForOrigin,
  sanitizeUrl,
} from '../config/clientUrl.js';

describe('B. Client URL and Allowed Origins Configuration', () => {
  it('B.1 sanitizeUrl trims and removes trailing slashes', () => {
    assert.equal(sanitizeUrl('  https://www.ps-white.com/  '), 'https://www.ps-white.com');
    assert.equal(sanitizeUrl('https://example.com///'), 'https://example.com');
    assert.equal(sanitizeUrl(''), '');
  });

  it('B.2 getAllowedOrigins parses comma-separated list of frontends', () => {
    const raw = 'https://www.ps-white.com, https://ps-white-ecommerce-rose.vercel.app/, http://localhost:5173/';
    const origins = getAllowedOrigins(raw);

    assert.deepEqual(origins, [
      'https://www.ps-white.com',
      'https://ps-white-ecommerce-rose.vercel.app',
      'http://localhost:5173',
    ]);
  });

  it('B.3 getPrimaryClientUrl returns first valid origin', () => {
    const raw = 'https://www.ps-white.com, https://ps-white-ecommerce-rose.vercel.app';
    const primary = getPrimaryClientUrl(raw);
    assert.equal(primary, 'https://www.ps-white.com');
  });

  it('B.4 getPrimaryClientUrl defaults to localhost if not set', () => {
    const primary = getPrimaryClientUrl('');
    assert.equal(primary, 'http://localhost:5173');
  });

  it('B.5 getClientUrlForOrigin returns matching allowed origin', () => {
    const raw = 'https://www.ps-white.com, https://ps-white-ecommerce-rose.vercel.app';
    const match = getClientUrlForOrigin('https://ps-white-ecommerce-rose.vercel.app', raw);
    assert.equal(match, 'https://ps-white-ecommerce-rose.vercel.app');

    const fallback = getClientUrlForOrigin('https://untrusted-domain.com', raw);
    assert.equal(fallback, 'https://www.ps-white.com');
  });

  it('B.6 getPrimaryClientUrl throws clear error on completely invalid URL', () => {
    assert.throws(
      () => getPrimaryClientUrl('not-a-valid-url'),
      /Invalid CLIENT_URL configuration/
    );
  });
});
