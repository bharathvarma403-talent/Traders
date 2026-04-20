const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken, existed } = await authService.registerUser(req.validatedBody);
    const status = existed ? 200 : 201;
    const message = existed ? 'Welcome back! Login successful.' : undefined;
    res.status(status).json({ token: accessToken, refreshToken, user, ...(message && { message }) });
  } catch (err) {
    if (err.isOperational && err.statusCode === 409) {
      return res.status(409).json({ error: err.message, redirectToLogin: err.redirectToLogin });
    }
    next(err);
  }
};

const loginEmail = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginWithEmail(req.validatedBody);
    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
};

const loginPhone = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginWithPhone(req.validatedBody);
    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginWithGoogle(req.validatedBody);
    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.rotateRefreshToken(
      req.validatedBody.refreshToken
    );
    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, loginEmail, loginPhone, googleLogin, refresh, getMe };
