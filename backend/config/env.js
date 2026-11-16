import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

let envFile = '.env';

if (process.env.DOTENV_CONFIG_PATH) {
  envFile = process.env.DOTENV_CONFIG_PATH;
} else if (process.env.APP_ENV === 'local-test' || process.env.NODE_ENV === 'test') {
  envFile = path.resolve(backendRoot, '.env.local-test');
} else {
  envFile = path.resolve(backendRoot, '.env');
}

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  // Fall back to standard .env if custom path doesn't exist
  dotenv.config({ path: path.resolve(backendRoot, '.env') });
}

export const activeEnvFile = envFile;
export default activeEnvFile;
