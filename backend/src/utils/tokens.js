const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');

function signAccessToken(user, permissions) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, permissions },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

function generatePasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
}

module.exports = { signAccessToken, signRefreshToken, verifyRefreshToken, generatePasswordResetToken };
