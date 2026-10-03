const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');

function protect(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Not authenticated. Missing bearer token.', 401));
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = { id: decoded.sub, role: decoded.role, permissions: decoded.permissions || [] };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.split(' ')[1], env.jwtSecret);
    req.user = { id: decoded.sub, role: decoded.role, permissions: decoded.permissions || [] };
  } catch {}
  return next();
}

module.exports = { protect, optionalAuth };
