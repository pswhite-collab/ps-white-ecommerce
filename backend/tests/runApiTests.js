process.env.APP_ENV = 'local-test';
process.env.NODE_ENV = 'test';

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testFile = path.resolve(__dirname, 'api.test.js');

const child = spawn(process.execPath, ['--test', testFile], {
  stdio: 'inherit',
  env: {
    ...process.env,
    APP_ENV: 'local-test',
    NODE_ENV: 'test',
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
