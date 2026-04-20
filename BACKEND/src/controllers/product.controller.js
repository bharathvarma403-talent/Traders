const prisma = require('../db');
const { notifyCatalogUpdate } = require('../utils/syncEmitter');
const { isProduction } = require('../config');
const AppError = require('../utils/AppError');
const { stockUpdateSchema } = require('../schemas');

// ── GET /api/products ─────────────────────────────────────────────────────────
const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { brand: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    if (isProduction) {
      const isForcedRefresh =
        req.headers['cache-control'] === 'no-cache' || req.query.forceRefresh === 'true';
      res.setHeader(
        'Cache-Control',
        isForcedRefresh
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=0, s-maxage=30, stale-while-revalidate=120'
      );
    }

    res.json(products);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/products/:id/stock (Admin) ─────────────────────────────────────
const updateStock = async (req, res, next) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) return next(new AppError('Invalid product id.', 400));

  const parsed = stockUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues.map((e) => e.message).join('; ') });
  }

  const data = {};
  if (parsed.data.stockStatus !== undefined) data.stockStatus = parsed.data.stockStatus;
  if (parsed.data.stockCount !== undefined) {
    data.stockCount = parsed.data.stockCount;
    if (parsed.data.stockStatus === undefined) {
      data.stockStatus = parsed.data.stockCount > 0 ? 'In Stock' : 'Out of Stock';
    }
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data,
      include: { brand: true },
    });
    notifyCatalogUpdate();
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError('Product not found.', 404));
    next(err);
  }
};

module.exports = { getProducts, updateStock };
