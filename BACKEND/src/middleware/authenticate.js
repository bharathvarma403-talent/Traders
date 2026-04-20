const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * Requires a valid Bearer JWT. Sets req.user on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
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
