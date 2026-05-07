const reservationService = require('../services/reservation.service');
const { reservationSchema } = require('../schemas');
const { notifyCatalogUpdate } = require('../utils/syncEmitter');
const AppError = require('../utils/AppError');

// ── POST /api/reservations ────────────────────────────────────────────────────
const createReservation = async (req, res, next) => {
  try {
    const body = {
      ...req.body,
      productId: Number(req.body.productId),
      quantity: Number(req.body.quantity),
    };

    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((e) => e.message).join('; ') });
    }

    const enriched = await reservationService.createReservation({
      userId: req.user.id,
      ...parsed.data,
    });
    res.status(201).json(enriched);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/reservations ─────────────────────────────────────────────────────
const getReservations = async (req, res, next) => {
  try {
    const result = await reservationService.getReservations({
      requestingUser: req.user,
      phone: String(req.query.phone || '').trim() || undefined,
      status: String(req.query.status || '').trim() || undefined,
      userId: req.query.userId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/reservations/:id/status (Admin) ────────────────────────────────
const updateStatus = async (req, res, next) => {
  const reservationId = Number(req.params.id);
  if (!Number.isInteger(reservationId)) return next(new AppError('Invalid reservation id.', 400));

  const nextStatus = String(req.body.status || '').trim();
  try {
    const enriched = await reservationService.updateReservationStatus({
      reservationId,
      nextStatus,
      notifyCatalogUpdate,
    });
    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

module.exports = { createReservation, getReservations, updateStatus };
