import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getApiBaseUrl,
  getApiOrigin,
  getCustomerGoogleAuthUrl,
  getAdminGoogleAuthUrl,
} from '../../frontend/src/utils/apiConfig.js';

describe('C. Frontend API and Google Auth URL Resolution', () => {
  it('C.1 Subdomain API host https://api.ps-white.com/api resolves origin without corrupting hostname', () => {
    const apiBase = 'https://api.ps-white.com/api';
    const origin = getApiOrigin(apiBase);
    assert.equal(origin, 'https://api.ps-white.com');

    const adminUrl = getAdminGoogleAuthUrl(apiBase);
    assert.equal(adminUrl, 'https://api.ps-white.com/api/admin/auth/google');

    const customerUrl = getCustomerGoogleAuthUrl(apiBase);
    assert.equal(customerUrl, 'https://api.ps-white.com/api/auth/google');
  });

  it('C.2 Path-based API host https://ps-white.com/api resolves origin correctly', () => {
    const apiBase = 'https://ps-white.com/api';
    const origin = getApiOrigin(apiBase);
    assert.equal(origin, 'https://ps-white.com');

    const adminUrl = getAdminGoogleAuthUrl(apiBase);
    assert.equal(adminUrl, 'https://ps-white.com/api/admin/auth/google');
  });

  it('C.3 Localhost API http://localhost:5000/api resolves origin correctly', () => {
    const apiBase = 'http://localhost:5000/api';
    const origin = getApiOrigin(apiBase);
    assert.equal(origin, 'http://localhost:5000');

    const adminUrl = getAdminGoogleAuthUrl(apiBase);
    assert.equal(adminUrl, 'http://localhost:5000/api/admin/auth/google');
  });

  it('C.4 Relative /api with window origin resolves to window origin', () => {
    const apiBase = '/api';
    const windowOrigin = 'https://www.ps-white.com';
    const origin = getApiOrigin(apiBase, windowOrigin);
    assert.equal(origin, 'https://www.ps-white.com');

    const adminUrl = getAdminGoogleAuthUrl(apiBase, windowOrigin);
    assert.equal(adminUrl, 'https://www.ps-white.com/api/admin/auth/google');
  });

  it('C.5 Missing VITE_API_URL in production logs error and returns safe /api fallback', () => {
    const result = getApiBaseUrl('', true);
    assert.equal(result, '/api');
  });
});
