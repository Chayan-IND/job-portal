const AppError = require('../utils/AppError');

function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Not authenticated.', 401));
    if (req.user.role === 'admin') return next();
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    return next();
  };
}

function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Not authenticated.', 401));
    if (req.user.role === 'admin') return next();
    if (!req.user.permissions.includes(permission)) {
      return next(new AppError(`Missing required permission: ${permission}`, 403));
    }
    return next();
  };
}

module.exports = { authorize, requirePermission };
