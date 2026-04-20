/**
 * AppError — Operational errors that can be sent to the client.
 * Pass these from services/controllers; the error handler will format them.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
