const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const { signAccessToken, signRefreshToken, verifyRefreshToken, generatePasswordResetToken } = require('../utils/tokens');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

async function getEffectivePermissions(user) {
  const role = await Role.findOne({ name: user.role }).lean();
  const basePermissions = role ? role.permissions : [];
  return Array.from(new Set([...basePermissions, ...user.extraPermissions]));
}

const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('An account with this email already exists.', 409));

  const roleDoc = await Role.findOne({ name: role });
  if (!roleDoc) return next(new AppError('Invalid role selected.', 400));

  const user = await User.create({ name, email, password, role });
  logger.info('User registered', { userId: user._id.toString(), role });

  const permissions = await getEffectivePermissions(user);
  const accessToken = signAccessToken(user, permissions);
  const refreshToken = signRefreshToken(user);

  res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Invalid email or password.', 401));

  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return next(new AppError(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`, 423));
  }
  if (!user.isActive) return next(new AppError('This account has been deactivated.', 403));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_DURATION_MS;
      user.failedLoginAttempts = 0;
      logger.warn('Account locked due to repeated failed logins', { userId: user._id.toString() });
    }
    await user.save();
    return next(new AppError('Invalid email or password.', 401));
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const permissions = await getEffectivePermissions(user);
  const accessToken = signAccessToken(user, permissions);
  const refreshToken = signRefreshToken(user);
  logger.info('User logged in', { userId: user._id.toString() });

  res.status(200).json({ success: true, data: { user, accessToken, refreshToken } });
});

const refresh = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new AppError('Refresh token is required.', 400));

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) return next(new AppError('Account no longer available.', 401));

  const permissions = await getEffectivePermissions(user);
  const accessToken = signAccessToken(user, permissions);

  res.status(200).json({ success: true, data: { accessToken } });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  const genericResponse = { success: true, message: 'If an account with that email exists, a reset link has been sent.' };
  if (!user) return res.status(200).json(genericResponse);

  const { rawToken, hashedToken } = generatePasswordResetToken();
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  if (!require('../config/env').env.isProduction) {
    logger.debug('Password reset token (dev only)', { rawToken });
  }

  res.status(200).json(genericResponse);
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) return next(new AppError('Reset token is invalid or has expired.', 400));

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info('Password reset completed', { userId: user._id.toString() });
  res.status(200).json({ success: true, message: 'Password has been reset. Please log in.' });
});

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ success: true, data: { user } });
});

module.exports = { register, login, refresh, forgotPassword, resetPassword, getMe };
