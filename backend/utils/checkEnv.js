/**
 * Environment sanity checker.
 * Validates critical configuration for production and local environments.
 * NEVER prints or logs secret values.
 */

import '../config/env.js';

export const REQUIRED_VARS_COMMON = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLIENT_URL',
];

export const REQUIRED_VARS_PRODUCTION = [
  ...REQUIRED_VARS_COMMON,
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CUSTOMER_CALLBACK_URL',
  'GOOGLE_ADMIN_CALLBACK_URL',
  'STRIPE_SECRET_KEY',
];

export const checkEnv = (isStrictProduction = process.env.NODE_ENV === 'production') => {
  const errors = [];
  const status = {};

  const varsToCheck = isStrictProduction ? REQUIRED_VARS_PRODUCTION : REQUIRED_VARS_COMMON;

  for (const name of varsToCheck) {
    const val = process.env[name];
    const isSet = typeof val === 'string' && val.trim().length > 0;
    status[name] = isSet ? 'SET' : 'MISSING';

    if (!isSet) {
      errors.push(`Missing required environment variable: ${name}`);
      continue;
    }

    if (isStrictProduction) {
      // In production, URLs must not point to localhost or 127.0.0.1
      if (['CLIENT_URL', 'GOOGLE_CUSTOMER_CALLBACK_URL', 'GOOGLE_ADMIN_CALLBACK_URL'].includes(name)) {
        if (/localhost|127\.0\.0\.1/i.test(val)) {
          errors.push(`Invalid production configuration: ${name} cannot point to localhost/127.0.0.1`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    status,
  };
};

export const printEnvStatus = () => {
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`\n=== PS White Environment Check (NODE_ENV=${process.env.NODE_ENV || 'development'}) ===`);

  const { valid, errors, status } = checkEnv(isProd);

  const entries = Object.entries(status);
  const maxKeyLen = Math.max(...entries.map(([k]) => k.length), 20);

  for (const [key, state] of entries) {
    const padded = key.padEnd(maxKeyLen, ' ');
    const label = state === 'SET' ? '✔ SET' : '✖ MISSING';
    console.log(`  ${padded} : ${label}`);
  }

  if (!valid) {
    console.error('\nEnvironment Validation Failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    return false;
  }

  console.log('\n✔ Environment configuration valid.\n');
  return true;
};

// If run directly: node backend/utils/checkEnv.js
if (process.argv[1] && process.argv[1].endsWith('checkEnv.js')) {
  const ok = printEnvStatus();
  process.exit(ok ? 0 : 1);
}

export default {
  checkEnv,
  printEnvStatus,
  REQUIRED_VARS_COMMON,
  REQUIRED_VARS_PRODUCTION,
};
