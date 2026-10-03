const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');
const { registerValidator, loginValidator, requestPasswordResetValidator, resetPasswordValidator } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerLimiter, registerValidator, validateRequest, authController.register);
router.post('/login', loginLimiter, loginValidator, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', passwordResetLimiter, requestPasswordResetValidator, validateRequest, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidator, validateRequest, authController.resetPassword);
router.get('/me', protect, authController.getMe);

module.exports = router;
