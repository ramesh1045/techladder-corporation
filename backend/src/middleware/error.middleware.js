const multer = require('multer');

/**
 * Standard error shape: { success: false, message, errors? }
 * Placed last in app.js so any thrown/next(err) call lands here.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  if (err && err.message && err.message.startsWith('Invalid')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error('[unhandled error]', err);
  }

  res.status(status).json({ success: false, message });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, notFoundHandler, ApiError };
