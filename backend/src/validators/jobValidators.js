const { body, query } = require('express-validator');

const createJobValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('jobType').isIn(['full-time', 'part-time', 'internship', 'contract']).withMessage('Invalid job type'),
  body('skillsRequired').optional().isArray().withMessage('skillsRequired must be an array'),
  body('salaryMin').optional().isFloat({ min: 0 }),
  body('salaryMax').optional().isFloat({ min: 0 }),
  body('applicationDeadline').optional().isISO8601().withMessage('Invalid date format'),
];

const updateJobValidator = [
  body('title').optional().trim().isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('location').optional().trim(),
  body('jobType').optional().isIn(['full-time', 'part-time', 'internship', 'contract']),
  body('skillsRequired').optional().isArray(),
  body('salaryMin').optional().isFloat({ min: 0 }),
  body('salaryMax').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['open', 'closed']),
];

const listJobsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('skills').optional().isString(),
  query('location').optional().isString(),
  query('jobType').optional().isIn(['full-time', 'part-time', 'internship', 'contract']),
  query('search').optional().isString(),
];

module.exports = { createJobValidator, updateJobValidator, listJobsValidator };
