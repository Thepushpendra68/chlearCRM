/**
 * Validation schemas for company-related operations
 */

const { body, query, param } = require('express-validator');

/**
 * Validation for company registration
 */
const validateCompanyRegistration = [
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('subdomain')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Subdomain must contain only lowercase letters, numbers, and hyphens'),

  body('industry')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Industry must be less than 50 characters'),

  body('size')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-1000', '1000+'])
    .withMessage('Invalid company size'),

  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country must be less than 50 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),

  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
];

/**
 * Validation for creating a company user
 */
const validateCreateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('first_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),

  body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),

  body('role')
    .optional()
    .isIn(['company_admin', 'manager', 'sales_rep'])
    .withMessage('Invalid role. Must be company_admin, manager, or sales_rep'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must be less than 50 characters'),
];

/**
 * Validation for updating user profile
 */
const validateUpdateUser = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department must be less than 50 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{0,20}$/)
    .withMessage('Please provide a valid phone number'),

  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),

  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'])
    .withMessage('Invalid language code'),

  body('role')
    .optional()
    .isIn(['company_admin', 'manager', 'sales_rep'])
    .withMessage('Invalid role. Must be company_admin, manager, or sales_rep'),
];

/**
 * Validation for user ID parameter
 */
const validateUserId = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

/**
 * Validation for getting users query parameters
 */
const validateGetUsers = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),

  query('role')
    .optional()
    .isIn(['company_admin', 'manager', 'sales_rep'])
    .withMessage('Invalid role filter'),

  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive must be a boolean'),

  query('company_id')
    .optional()
    .isUUID()
    .withMessage('Invalid company ID format'),
];

/**
 * Validation for getting companies query parameters
 */
const validateGetCompanies = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status filter'),
];

module.exports = {
  validateCompanyRegistration,
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
  validateGetUsers,
  validateGetCompanies,
};