const express = require('express');
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validateRequest } = require('../middleware/validate');
const { uploadLogoMiddleware } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { updateCompanyProfileValidator } = require('../validators/profileValidators');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('company'), companyController.getMyProfile);
router.patch('/me', authorize('company'), updateCompanyProfileValidator, validateRequest, companyController.updateMyProfile);
router.post('/me/logo', authorize('company'), uploadLimiter, uploadLogoMiddleware, companyController.uploadLogo);

module.exports = router;
