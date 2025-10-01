const { body } = require('express-validator');

/**
 * Validation rules for lead creation and updates
 */
const validateLead = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{0,20}$/)
    .withMessage('Please provide a valid phone number')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),

  // CRM Business Rule: Must have at least one contact method
  body().custom((value, { req }) => {
    const { email, phone } = req.body;
    if (!email && !phone) {
      throw new Error('At least one contact method (email or phone) is required for a lead');
    }
    return true;
  }),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),

  body('job_title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),

  body('lead_source')
    .optional()
    .isIn(['website', 'referral', 'cold_call', 'social_media', 'advertisement', 'other'])
    .withMessage('Invalid lead source'),

  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'converted', 'lost'])
    .withMessage('Invalid lead status'),

  body('assigned_to')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true; // Allow empty
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
    })
    .withMessage('Invalid assigned user ID'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  body('pipeline_stage_id')
    .optional()
    .custom((value) => {
      if (value === '' || value === null) return true; // Allow empty string
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
    })
    .withMessage('Invalid pipeline stage ID'),

  body('deal_value')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true; // Allow empty
      return !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
    })
    .withMessage('Deal value must be a positive number'),

  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100'),

  body('expected_close_date')
    .optional()
    .custom((value) => {
      if (value === '' || value === null) return true; // Allow empty
      return !isNaN(Date.parse(value));
    })
    .withMessage('Invalid expected close date'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
];

/**
 * Validation rules for lead search and filtering
 */
const validateLeadSearch = [
  body('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),

  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'converted', 'lost'])
    .withMessage('Invalid status filter'),

  body('source')
    .optional()
    .isIn(['website', 'referral', 'cold_call', 'social_media', 'advertisement', 'other'])
    .withMessage('Invalid source filter'),

  body('assigned_to')
    .optional()
    .isUUID()
    .withMessage('Invalid assigned user filter'),

  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  body('sort_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'first_name', 'last_name', 'company', 'status'])
    .withMessage('Invalid sort field'),

  body('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

module.exports = {
  validateLead,
  validateLeadSearch
};
