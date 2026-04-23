const fs = require('fs');
const path = require('path');
const prisma = require('../db');
const { notifyCatalogUpdate } = require('../utils/syncEmitter');
const AppError = require('../utils/AppError');
const { productUpsertSchema } = require('../schemas');

// ── GET /api/admin/users ──────────────────────────────────────────────────────
const getUsers = async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/products ──────────────────────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('Product image is required.', 400));

    const parsed = productUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((e) => e.message).join('; ') });
    }

    const { name, category, subcategory, unit, description, price, brandName, stockCount } = parsed.data;

    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });

    const product = await prisma.product.create({
      data: {
        name, category, subcategory, description: description || null,
        price, unit, brandId: brand.id,
        stockCount: stockCount ?? 100,
        stockStatus: (stockCount ?? 100) > 0 ? 'In Stock' : 'Out of Stock',
        imageUrl: `/uploads/${req.file.filename}`,
      },
      include: { brand: true },
    });

    notifyCatalogUpdate();
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
const updateProduct = async (req, res, next) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) return next(new AppError('Invalid product id.', 400));

  try {
    const parsed = productUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((e) => e.message).join('; ') });
    }

    const { name, category, subcategory, unit, description, price, brandName, stockCount } = parsed.data;

    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });

    const oldProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!oldProduct) return next(new AppError('Product not found.', 404));

    const updateData = {
      name, category, subcategory, description, price, unit, brandId: brand.id,
      stockCount: stockCount ?? 0,
      stockStatus: (stockCount ?? 0) > 0 ? 'In Stock' : 'Out of Stock',
    };

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
      // Clean up old image if it exists and is a local file
      if (oldProduct.imageUrl && oldProduct.imageUrl.startsWith('/uploads/')) {
        const oldFileName = oldProduct.imageUrl.split('/').pop();
        const oldFilePath = path.join(__dirname, '../../uploads', oldFileName);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { brand: true },
    });

    notifyCatalogUpdate();
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError('Product not found.', 404));
    next(err);
  }
};

// ── DELETE /api/admin/products/:id ───────────────────────────────────────────
const deleteProduct = async (req, res, next) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) return next(new AppError('Invalid product id.', 400));

  try {
    const oldProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!oldProduct) return next(new AppError('Product not found.', 404));

    await prisma.product.delete({ where: { id: productId } });

    // Clean up associated local image
    if (oldProduct.imageUrl && oldProduct.imageUrl.startsWith('/uploads/')) {
      const oldFileName = oldProduct.imageUrl.split('/').pop();
      const oldFilePath = path.join(__dirname, '../../uploads', oldFileName);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }

    notifyCatalogUpdate();
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    if (err.code === 'P2025') return next(new AppError('Product not found.', 404));
    next(err);
  }
};

module.exports = { getUsers, createProduct, updateProduct, deleteProduct };
