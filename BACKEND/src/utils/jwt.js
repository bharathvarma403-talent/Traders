const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET } = require('../config');

const signAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

const signRefreshToken = (user) =>
  jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

module.exports = { signAccessToken, signRefreshToken };
