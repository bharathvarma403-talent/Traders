const prisma = require('../db');
const { enrichReservations } = require('../utils/helpers');
const AppError = require('../utils/AppError');
const { parseDateOnly } = require('../utils/helpers');

const RESERVATION_STATUSES = new Set(['Pending', 'Accepted', 'Rejected', 'Completed']);

// ── Create Reservation ────────────────────────────────────────────────────────

const createReservation = async ({ userId, productId, quantity, pickupDate, phoneNumber, notes }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!user) throw new AppError('User not found.', 404);

  const phoneToUse = phoneNumber || user.phone;
  if (!phoneToUse) {
    throw new AppError('Phone number is required so the admin can contact you.', 400);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found.', 404);
  if (product.stockStatus === 'Out of Stock') {
    throw new AppError('This product is currently out of stock.', 400);
  }
  if (quantity > product.stockCount) {
    throw new AppError(`Only ${product.stockCount} unit(s) are currently available.`, 400);
  }

  // If user is providing a different phone, verify it isn't already claimed
  if (phoneToUse !== user.phone) {
    const conflict = await prisma.user.findFirst({
      where: { phone: phoneToUse, NOT: { id: userId } },
      select: { id: true },
    });
    if (conflict) {
      throw new AppError('That phone number is already linked to another account.', 409);
    }
    await prisma.user.update({ where: { id: userId }, data: { phone: phoneToUse } });
  }

  const pickupDateValue = parseDateOnly(pickupDate);
  if (!pickupDateValue) throw new AppError('Pickup date must be valid.', 400);

  const reservation = await prisma.reservation.create({
    data: {
      name: user.name,
      phone: phoneToUse,
      email: user.email,
      userId,
      productId,
      quantity,
      pickupDate: pickupDateValue,
      notes: notes || null,
    },
  });

  const [enriched] = await enrichReservations([reservation]);
  return enriched;
};

// ── Get Reservations ────────────────────────────────────────────────────────

const getReservations = async ({ requestingUser, phone, status, userId: filterUserId }) => {
  if (status && !RESERVATION_STATUSES.has(status)) {
    throw new AppError('Invalid status.', 400);
  }

  const where = {};
  if (status) where.status = status;

  if (requestingUser.role === 'ADMIN') {
    if (phone) where.phone = phone;
    if (filterUserId) where.userId = Number(filterUserId);
  } else {
    where.userId = requestingUser.id;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return enrichReservations(reservations);
};

// ── Update Reservation Status (Admin) ─────────────────────────────────────────

const updateReservationStatus = async ({ reservationId, nextStatus, notifyCatalogUpdate }) => {
  if (!RESERVATION_STATUSES.has(nextStatus)) {
    throw new AppError('Invalid status.', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.reservation.findUnique({
      where: { id: reservationId },
      select: { status: true, productId: true, quantity: true },
    });
    if (!current) throw new AppError('Reservation not found.', 404);

    // Deduct stock when accepting
    if (current.status !== 'Accepted' && nextStatus === 'Accepted') {
      const product = await tx.product.findUnique({ where: { id: current.productId } });
      if (!product) throw new AppError('Product not found.', 404);
      if (product.stockCount < current.quantity) {
        throw new AppError('Insufficient stock to fulfil this order.', 400);
      }
      await tx.product.update({
        where: { id: current.productId },
        data: {
          stockCount: { decrement: current.quantity },
          stockStatus: product.stockCount - current.quantity > 0 ? 'In Stock' : 'Out of Stock',
        },
      });
    }

    // Restore stock when rejecting an already-accepted order
    if (current.status === 'Accepted' && nextStatus === 'Rejected') {
      await tx.product.update({
        where: { id: current.productId },
        data: { stockCount: { increment: current.quantity }, stockStatus: 'In Stock' },
      });
    }

    return tx.reservation.update({ where: { id: reservationId }, data: { status: nextStatus } });
  });

  notifyCatalogUpdate();
  const [enriched] = await enrichReservations([result]);
  return enriched;
};

module.exports = { createReservation, getReservations, updateReservationStatus };
