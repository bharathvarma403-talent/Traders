const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * Requires a valid Bearer JWT. Sets req.user on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.', code: 'NO_TOKEN' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.', code: 'INVALID_TOKEN' });
    }
    return res.status(401).json({ error: 'Unauthorized: Authentication failed.', code: 'AUTH_FAILED' });
  }
};

/**
 * Attaches req.user if a valid Bearer JWT is present, but never blocks the request.
 */
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch { /* ignore */ }
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate };
