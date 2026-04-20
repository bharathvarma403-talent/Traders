const AppError = require('../utils/AppError');

/**
 * Role-based access control middleware factory.
 * Usage: authorize(['ADMIN'])
 */
const authorize = (roles = []) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions.', 403));
    }
    next();
  };

module.exports = authorize;
