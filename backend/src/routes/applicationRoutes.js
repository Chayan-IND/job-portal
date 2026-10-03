const express = require('express');
const applicationController = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission } = require('../middleware/rbac');
const { validateRequest } = require('../middleware/validate');
const { applyToJobValidator, updateApplicationStatusValidator, listApplicationsValidator } = require('../validators/applicationValidators');

const router = express.Router();

router.use(protect);

router.post('/jobs/:jobId/apply', authorize('student'), requirePermission('application:create'), applyToJobValidator, validateRequest, applicationController.applyToJob);
router.get('/me', authorize('student'), listApplicationsValidator, validateRequest, applicationController.listMyApplications);
router.get('/me/stats', authorize('student'), applicationController.getMyApplicationStats);
router.get('/jobs/:jobId', authorize('company'), listApplicationsValidator, validateRequest, applicationController.listApplicationsForJob);
router.patch('/:applicationId/status', authorize('company'), requirePermission('application:update_status'), updateApplicationStatusValidator, validateRequest, applicationController.updateApplicationStatus);

module.exports = router;
