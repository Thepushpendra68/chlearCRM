const { body } = require('express-validator');

const validateAccount = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Account name must be between 1 and 255 characters'),
  
  body('website')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Website must be a valid URL');
      }
    }),
  
  body('email')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      // Validate email format only if value is provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Email must be a valid email address');
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'archived'])
    .withMessage('Status must be active, inactive, or archived'),
  
  body('parent_account_id')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      // UUID v4 regex validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('Parent account ID must be a valid UUID');
      }
      return true;
    }),
  
  body('assigned_to')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      // UUID v4 regex validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('Assigned to must be a valid UUID');
      }
      return true;
    }),
  
  body('annual_revenue')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Annual revenue must be a positive number');
      }
      return true;
    }),
  
  body('employee_count')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      // Check if value is a number and if it's an integer
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        throw new Error('Employee count must be a non-negative integer');
      }
      return true;
    }),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('custom_fields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object')
];

module.exports = {
  validateAccount
};

