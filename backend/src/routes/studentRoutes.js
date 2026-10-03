const express = require('express');
const studentController = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validateRequest } = require('../middleware/validate');
const { uploadResumeMiddleware } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { updateStudentProfileValidator, listStudentsValidator } = require('../validators/profileValidators');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('student'), studentController.getMyProfile);
router.patch('/me', authorize('student'), updateStudentProfileValidator, validateRequest, studentController.updateMyProfile);
router.post('/me/resume', authorize('student'), uploadLimiter, uploadResumeMiddleware, studentController.uploadResume);
router.get('/', authorize('company'), listStudentsValidator, validateRequest, studentController.listStudents);

module.exports = router;
