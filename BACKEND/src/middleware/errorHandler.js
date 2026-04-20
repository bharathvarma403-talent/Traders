const multer = require('multer');
const { isProduction } = require('../config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Multer file errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  // Custom file type validation from upload.js
  if (err.message?.includes('Only JPG, PNG, WebP, and AVIF')) {
    return res.status(400).json({ error: err.message });
  }

  // CORS rejection
  if (err.message?.includes('not allowed by CORS')) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }

  // Operational errors (AppError instances) — safe to expose to client
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }

  // Unknown / programmer errors — don't leak details in production
  console.error('[errorHandler] Unhandled error:', err);
  return res.status(500).json({
    error: isProduction ? 'An unexpected error occurred.' : err.message,
  });
};

module.exports = errorHandler;
