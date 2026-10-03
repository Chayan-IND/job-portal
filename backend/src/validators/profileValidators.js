const { body, query } = require('express-validator');

const updateStudentProfileValidator = [
  body('phone').optional().trim().isLength({ max: 20 }),
  body('university').optional().trim().isLength({ max: 150 }),
  body('graduationYear').optional().isInt({ min: 1950, max: 2100 }).withMessage('Invalid graduation year'),
  body('skills').optional().isArray().withMessage('skills must be an array'),
  body('bio').optional().isString().isLength({ max: 1000 }),
];

const updateCompanyProfileValidator = [
  body('companyName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('website').optional().trim().isURL().withMessage('Website must be a valid URL'),
  body('description').optional().isString().isLength({ max: 2000 }),
];

const listStudentsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('skills').optional().isString(),
  query('university').optional().isString(),
];

module.exports = { updateStudentProfileValidator, updateCompanyProfileValidator, listStudentsValidator };
