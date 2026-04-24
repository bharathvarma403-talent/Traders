const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const { isProduction, FRONTEND_URL } = require('./config');
const { syncEmitter } = require('./utils/syncEmitter');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const reservationRoutes = require('./routes/reservation.routes');
const adminRoutes = require('./routes/admin.routes');
const novaRoutes = require('./routes/nova.routes');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow upload images to be loaded cross-origin
  })
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
const configuredOrigins = FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  'https://vasavitraders.store',
  'https://www.vasavitraders.store',
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests (curl, Render health check)
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── SSE — Real-time catalog sync ──────────────────────────────────────────────
app.get('/api/sync/catalog', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onUpdate = () => {
    res.write(`data: ${JSON.stringify({ type: 'CATALOG_UPDATED', timestamp: Date.now() })}\n\n`);
  };
  syncEmitter.on('update', onUpdate);
  req.on('close', () => syncEmitter.removeListener('update', onUpdate));
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const prisma = require('./db');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'ERROR', database: 'disconnected' });
  }
});

app.get('/', (_req, res) => res.send('Vasavi Traders API is running 🚀'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nova', novaRoutes);

// ── 404 for unmatched API routes ──────────────────────────────────────────────
app.use('/api/{*path}', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
