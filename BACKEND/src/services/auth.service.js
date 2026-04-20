const { OAuth2Client } = require('google-auth-library');
const prisma = require('../db');
const { hash, compare } = require('../utils/password');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const { JWT_REFRESH_SECRET, GOOGLE_CLIENT_IDS, GOOGLE_CLIENT_ID } = require('../config');
const {
  safeUser,
  normalizeEmail,
  isGoogleClientId,
  findUserByEmail,
  updateLastLogin,
} = require('../utils/helpers');
const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');

const googleClient = new OAuth2Client();

// ── Register ─────────────────────────────────────────────────────────────────

const registerUser = async ({ name, email, password, phone }) => {
  const normalizedEmail = normalizeEmail(email);

  const existingEmail = await findUserByEmail(normalizedEmail);
  const existingPhone = phone
    ? await prisma.user.findUnique({ where: { phone } })
    : null;
  const existingUser = existingEmail || existingPhone;

  if (existingUser) {
    // If password matches, treat as silent re-login (idempotent registration)
    const isMatch = existingUser.password
      ? await compare(password, existingUser.password)
      : false;

    if (isMatch) {
      await prisma.user.update({ where: { id: existingUser.id }, data: { lastLoginAt: new Date() } });
      const accessToken = signAccessToken(existingUser);
      const refreshToken = signRefreshToken(existingUser);
      return { user: safeUser(existingUser), accessToken, refreshToken, existed: true };
    }

    const err = new AppError(
      existingUser.googleId
        ? 'An account already exists for this email. Please sign in with Google.'
        : 'An account already exists. Please log in with the correct password.',
      409
    );
    err.redirectToLogin = true;
    throw err;
  }

  const hashed = await hash(password);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashed,
      phone: phone || null,
      role: 'USER',
      lastLoginAt: new Date(),
    },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { user: safeUser(user), accessToken, refreshToken, existed: false };
};

// ── Email Login ───────────────────────────────────────────────────────────────

const loginWithEmail = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user || !user.password) throw new AppError('Invalid credentials.', 401);

  const isMatch = await compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid credentials.', 401);

  await updateLastLogin(user.id);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { user: safeUser(user), accessToken, refreshToken };
};

// ── Phone Login ───────────────────────────────────────────────────────────────

const loginWithPhone = async ({ phone, password }) => {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.password) throw new AppError('Invalid credentials.', 401);

  const isMatch = await compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid credentials.', 401);

  await updateLastLogin(user.id);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { user: safeUser(user), accessToken, refreshToken };
};

// ── Google OAuth ──────────────────────────────────────────────────────────────

const loginWithGoogle = async ({ credential, clientId }) => {
  const requestClientId = isGoogleClientId(clientId) ? clientId.trim() : null;
  const allowedIds = [...new Set([GOOGLE_CLIENT_ID, requestClientId, ...GOOGLE_CLIENT_IDS])].filter(Boolean);

  if (allowedIds.length === 0) {
    throw new AppError(
      'Google OAuth is not configured on the server. Check your BACKEND/.env file.',
      500
    );
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: allowedIds });
    payload = ticket.getPayload();
  } catch (err) {
    const isAudienceMismatch = /audience|recipient/i.test(err.message || '');
    throw new AppError(
      isAudienceMismatch
        ? 'Security Error: Google Client ID mismatch. Ensure GOOGLE_CLIENT_ID is consistent across Vercel and Render.'
        : 'Unable to verify Google sign-in. Your session may have expired.',
      401
    );
  }

  if (!payload?.email || payload.email_verified === false) {
    throw new AppError('Google account email could not be verified.', 401);
  }

  const { email, name, sub: googleId } = payload;
  const normalizedEmail = normalizeEmail(email);

  let user = await findUserByEmail(normalizedEmail);
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        googleId,
        role: 'USER',
        lastLoginAt: new Date(),
      },
    });
  } else {
    if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
    }
    await updateLastLogin(user.id);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { user: safeUser(user), accessToken, refreshToken };
};

// ── Refresh Token ─────────────────────────────────────────────────────────────

const rotateRefreshToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new AppError('User not found.', 401);

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  return { user: safeUser(user), accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ── Get Current User ──────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404);
  return safeUser(user);
};

module.exports = {
  registerUser,
  loginWithEmail,
  loginWithPhone,
  loginWithGoogle,
  rotateRefreshToken,
  getMe,
};
