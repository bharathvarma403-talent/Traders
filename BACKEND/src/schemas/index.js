const { z } = require('zod');
const { parseDateOnly } = require('../utils/helpers');

// ── Auth Schemas ────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .length(6, 'Password must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'Password must contain only numbers'),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number')
    .optional(),
});

const loginEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const loginPhoneSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
  password: z.string().min(1, 'Password is required'),
});

const googleSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  clientId: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── Product Schemas ─────────────────────────────────────────────────────────

const STOCK_STATUS_VALUES = ['In Stock', 'Out of Stock'];

const stockUpdateSchema = z
  .object({
    stockStatus: z.enum(STOCK_STATUS_VALUES).optional(),
    stockCount: z.coerce.number().int().min(0).optional(),
  })
  .refine((v) => v.stockStatus !== undefined || v.stockCount !== undefined, {
    message: 'No valid fields to update.',
  });

const productUpsertSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required.').max(120),
  category: z.string().trim().min(2, 'Category is required.').max(60),
  subcategory: z.string().trim().min(2, 'Subcategory is required.').max(80),
  unit: z.string().trim().min(1, 'Unit is required.').max(30),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters.')
    .max(1000),
  price: z.coerce.number().positive('Price must be greater than zero.'),
  brandName: z.string().trim().min(2, 'Brand is required.').max(100),
  stockCount: z.coerce.number().int().min(0).optional(),
});

// ── Reservation Schema ──────────────────────────────────────────────────────

const RESERVATION_STATUS_VALUES = ['Pending', 'Accepted', 'Rejected', 'Completed'];

const reservationSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  pickupDate: z
    .string()
    .trim()
    .refine((value) => {
      const parsed = parseDateOnly(value);
      if (!parsed) return false;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const minAllowed = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      return parsed >= minAllowed;
    }, 'Pickup date must be valid and no earlier than today'),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, 'A valid phone number is required to place an order'),
  notes: z.string().trim().max(500).optional(),
});

module.exports = {
  registerSchema,
  loginEmailSchema,
  loginPhoneSchema,
  googleSchema,
  refreshSchema,
  stockUpdateSchema,
  productUpsertSchema,
  reservationSchema,
  STOCK_STATUS_VALUES,
  RESERVATION_STATUS_VALUES,
};
