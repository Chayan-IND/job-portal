const express = require('express');
const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission } = require('../middleware/rbac');
const { validateRequest } = require('../middleware/validate');
const { createJobValidator, updateJobValidator, listJobsValidator } = require('../validators/jobValidators');

const router = express.Router();

router.get('/', listJobsValidator, validateRequest, jobController.listJobs);
router.get('/mine', protect, authorize('company'), jobController.listMyJobs);
router.get('/mine/stats', protect, authorize('company'), jobController.getMyJobStats);
router.post('/', protect, authorize('company'), requirePermission('job:create'), createJobValidator, validateRequest, jobController.createJob);
router.patch('/:jobId', protect, authorize('company'), requirePermission('job:edit_own'), updateJobValidator, validateRequest, jobController.updateJob);
router.delete('/:jobId', protect, authorize('company'), jobController.deleteJob);
router.get('/:jobId', jobController.getJob);

module.exports = router;
