const { body, param, query } = require('express-validator');

const applyToJobValidator = [
  param('jobId').isMongoId().withMessage('Invalid job id'),
  body('coverNote').optional().isString().isLength({ max: 1000 }),
];

const updateApplicationStatusValidator = [
  param('applicationId').isMongoId().withMessage('Invalid application id'),
  body('status').isIn(['shortlisted', 'rejected', 'hired']).withMessage('Status must be shortlisted, rejected, or hired'),
];

const listApplicationsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['applied', 'shortlisted', 'rejected', 'hired']),
];

module.exports = { applyToJobValidator, updateApplicationStatusValidator, listApplicationsValidator };
