const prisma = require('../db');

/** Strip sensitive fields before sending a user object to the client. */
const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone ?? null,
  role: u.role,
});

const normalizeEmail = (value = '') => value.trim().toLowerCase();

const isGoogleClientId = (value = '') =>
  /^[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(String(value).trim());

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const parseDateOnly = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Finds a user by email with case-insensitive fallback for databases/collations
 * that do case-sensitive comparisons.
 */
const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const exactMatch = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exactMatch) return exactMatch;

  const [caseInsensitiveMatch] = await prisma.$queryRaw`
    SELECT * FROM "User"
    WHERE LOWER("email") = LOWER(${normalizedEmail})
    LIMIT 1
  `;
  return caseInsensitiveMatch || null;
};

/** Update lastLoginAt — non-critical, never throws. */
const updateLastLogin = async (userId) => {
  try {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  } catch { /* non-critical */ }
};

/**
 * Enrich reservations with full product and user data.
 * Batches lookups to avoid N+1 queries.
 */
const enrichReservations = async (reservations) => {
  const productIds = [...new Set(reservations.map((r) => r.productId).filter(Boolean))];
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, include: { brand: true } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const userIds = [...new Set(reservations.map((r) => r.userId).filter(Boolean))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, phone: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return reservations.map((r) => ({
    ...r,
    product: productMap.get(r.productId) || null,
    linkedUser: r.userId ? (userMap.get(r.userId) || null) : null,
    email: r.email || (r.userId ? userMap.get(r.userId)?.email : null) || null,
  }));
};

module.exports = {
  safeUser,
  normalizeEmail,
  isGoogleClientId,
  formatCurrency,
  parseDateOnly,
  findUserByEmail,
  updateLastLogin,
  enrichReservations,
};
