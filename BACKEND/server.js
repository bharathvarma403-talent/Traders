require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/db');
const { hash } = require('./src/utils/password');
const {
  PORT,
  BOOTSTRAP_ADMIN_EMAIL,
  BOOTSTRAP_ADMIN_PASSWORD,
  BOOTSTRAP_ADMIN_NAME,
} = require('./src/config');

// ── Bootstrap Admin ───────────────────────────────────────────────────────────
// On every startup, ensure the configured admin account exists and is up-to-date.
const ensureAdminExists = async () => {
  if (!BOOTSTRAP_ADMIN_EMAIL || !BOOTSTRAP_ADMIN_PASSWORD) {
    console.log('[bootstrap] Admin credentials not configured — skipping.');
    return;
  }
  try {
    const hashed = await hash(BOOTSTRAP_ADMIN_PASSWORD);
    await prisma.user.upsert({
      where: { email: BOOTSTRAP_ADMIN_EMAIL },
      update: { name: BOOTSTRAP_ADMIN_NAME, password: hashed, role: 'ADMIN' },
      create: {
        name: BOOTSTRAP_ADMIN_NAME,
        email: BOOTSTRAP_ADMIN_EMAIL,
        password: hashed,
        role: 'ADMIN',
      },
    });
    console.log(`[bootstrap] Admin ready: ${BOOTSTRAP_ADMIN_EMAIL}`);
  } catch (err) {
    console.error('[bootstrap] Failed to create admin:', err.message);
  }
};

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('[db] Connection verified.');

    await ensureAdminExists();

    app.listen(PORT, () => {
      console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
};

start();
