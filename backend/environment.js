import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const DEFAULT_DEVELOPMENT_JWT_SECRET = 'dev_secret_change_me';

function parsePositiveInteger(value, fallback, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function requireProductionValue(name, value) {
  if (IS_PRODUCTION && (!value || !String(value).trim())) {
    throw new Error(`${name} is required when NODE_ENV=production`);
  }
}

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEVELOPMENT_JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DB_PASSWORD = process.env.DB_PASSWORD ?? '';

requireProductionValue('DB_HOST', process.env.DB_HOST);
requireProductionValue('DB_USER', process.env.DB_USER);
requireProductionValue('DB_PASSWORD', process.env.DB_PASSWORD);
requireProductionValue('DB_NAME', process.env.DB_NAME);
requireProductionValue('JWT_SECRET', process.env.JWT_SECRET);
requireProductionValue('FRONTEND_URL', process.env.FRONTEND_URL);

if (IS_PRODUCTION && JWT_SECRET === DEFAULT_DEVELOPMENT_JWT_SECRET) {
  throw new Error('JWT_SECRET must not use the development fallback in production');
}

if (IS_PRODUCTION && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production');
}

if (IS_PRODUCTION && !FRONTEND_URL.startsWith('https://')) {
  throw new Error('FRONTEND_URL must use HTTPS in production');
}

export const env = Object.freeze({
  NODE_ENV,
  IS_PRODUCTION,
  PORT: parsePositiveInteger(process.env.PORT, 5000, 'PORT'),
  TRUST_PROXY: parsePositiveInteger(process.env.TRUST_PROXY, 1, 'TRUST_PROXY'),
  FRONTEND_URL: FRONTEND_URL.replace(/\/+$/, ''),
  JWT_SECRET,
  SESSION_TTL_HOURS: parsePositiveInteger(
    process.env.SESSION_TTL_HOURS,
    12,
    'SESSION_TTL_HOURS'
  ),
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'bulukumba_admin_session',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parsePositiveInteger(process.env.DB_PORT, 3306, 'DB_PORT'),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || 'bulukumba_tourism_db',
  DB_CONNECTION_LIMIT: parsePositiveInteger(
    process.env.DB_CONNECTION_LIMIT,
    10,
    'DB_CONNECTION_LIMIT'
  ),
  UPLOAD_DIR: path.resolve(
    process.env.UPLOAD_DIR || path.join(__dirname, 'uploads-bulukumba-wisata')
  ),
  RUN_MIGRATIONS_ON_STARTUP:
    process.env.RUN_MIGRATIONS_ON_STARTUP === undefined
      ? !IS_PRODUCTION
      : process.env.RUN_MIGRATIONS_ON_STARTUP === 'true',
  SEED_ADMIN_ON_STARTUP: process.env.SEED_ADMIN_ON_STARTUP === 'true',
  INITIAL_ADMIN_USERNAME: process.env.INITIAL_ADMIN_USERNAME,
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD,
});
