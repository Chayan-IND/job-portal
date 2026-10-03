const logger = require('../utils/logger');
const { env } = require('../config/env');

function handleCastError(err) {
  return { statusCode: 400, message: `Invalid ${err.path}: ${err.value}` };
}
function handleDuplicateFieldError(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return { statusCode: 409, message: `${field} already in use.` };
}
function handleValidationError(err) {
  const messages = Object.values(err.errors).map((e) => e.message);
  return { statusCode: 400, message: messages.join('. ') };
}
function handleJWTError() {
  return { statusCode: 401, message: 'Invalid authentication token.' };
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError') ({ statusCode, message } = handleCastError(err));
  else if (err.code === 11000) ({ statusCode, message } = handleDuplicateFieldError(err));
  else if (err.name === 'ValidationError') ({ statusCode, message } = handleValidationError(err));
  else if (err.name === 'JsonWebTokenError') ({ statusCode, message } = handleJWTError());

  const isOperational = err.isOperational || statusCode < 500;

  logger.error(message, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    stack: env.isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message: isOperational ? message : 'Something went wrong. Please try again later.',
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}

function notFoundHandler(req, _res, next) {
  const AppError = require('../utils/AppError');
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

module.exports = { errorHandler, notFoundHandler };
