require('dotenv').config();
const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';

const readSecret = (name) => {
  const value = String(process.env[name] || '').trim();
  if (value) return value;

  if (isProduction) {
    console.error(`[FATAL] ${name} is missing in production!`);
    process.exit(1);
  }

  const generated = crypto.randomBytes(32).toString('hex');
  console.warn(`[config] ${name} not set — using ephemeral dev secret.`);
  return generated;
};

const GOOGLE_CLIENT_IDS = [
  ...new Set(
    [process.env.GOOGLE_CLIENT_IDS, process.env.GOOGLE_CLIENT_ID, process.env.VITE_GOOGLE_CLIENT_ID]
      .flatMap((v) => String(v || '').split(','))
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((v) => /^[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(v))
  ),
];

module.exports = {
  isProduction,
  PORT: Number(process.env.PORT) || 4000,
  JWT_SECRET: readSecret('JWT_SECRET'),
  JWT_REFRESH_SECRET: readSecret('JWT_REFRESH_SECRET'),
  GOOGLE_CLIENT_IDS,
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_IDS[0] || null,
  FRONTEND_URL: String(process.env.FRONTEND_URL || ''),
  BOOTSTRAP_ADMIN_EMAIL: String(
    process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || ''
  ).trim().toLowerCase(),
  BOOTSTRAP_ADMIN_PASSWORD: String(
    process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || ''
  ),
  BOOTSTRAP_ADMIN_NAME: (
    String(process.env.BOOTSTRAP_ADMIN_NAME || process.env.SEED_ADMIN_NAME || '').trim() ||
    'Vasavi Admin'
  ),
};
