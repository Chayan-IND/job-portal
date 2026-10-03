const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validateRequest(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
  return next(new AppError(messages.join(', '), 400));
}

module.exports = { validateRequest };
