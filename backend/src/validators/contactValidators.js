const { body, param } = require('express-validator');

/**
 * Validation rules for creating a contact
 */
const createContactValidation = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must not exceed 50 characters'),

  body('mobile_phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Mobile phone must not exceed 50 characters'),

  body('title')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Title must not exceed 150 characters'),

  body('department')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),

  body('linkedin_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL'),

  body('twitter_handle')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Twitter handle must not exceed 50 characters'),

  body('preferred_contact_method')
    .optional({ nullable: true })
    .isIn(['email', 'phone', 'mobile', 'linkedin'])
    .withMessage('Preferred contact method must be one of: email, phone, mobile, linkedin'),

  body('do_not_call')
    .optional()
    .isBoolean()
    .withMessage('Do not call must be a boolean'),

  body('do_not_email')
    .optional()
    .isBoolean()
    .withMessage('Do not email must be a boolean'),

  body('is_primary')
    .optional()
    .isBoolean()
    .withMessage('Is primary must be a boolean'),

  body('is_decision_maker')
    .optional()
    .isBoolean()
    .withMessage('Is decision maker must be a boolean'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'bounced', 'unsubscribed', 'archived'])
    .withMessage('Status must be one of: active, inactive, bounced, unsubscribed, archived'),

  body('lifecycle_stage')
    .optional({ nullable: true })
    .isIn(['lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'evangelist'])
    .withMessage('Lifecycle stage must be one of: lead, marketing_qualified, sales_qualified, opportunity, customer, evangelist'),

  body('account_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),

  body('assigned_to')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Assigned to must be a valid UUID'),

  body('reporting_to')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Reporting to must be a valid UUID'),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters'),

  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),

  body('custom_fields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object'),

  // Custom validation: At least one contact method required
  body().custom((value, { req }) => {
    const { email, phone, mobile_phone } = req.body;
    if (!email && !phone && !mobile_phone) {
      throw new Error('At least one contact method (email, phone, or mobile phone) is required');
    }
    return true;
  })
];

/**
 * Validation rules for updating a contact
 */
const updateContactValidation = [
  param('id')
    .isUUID()
    .withMessage('Contact ID must be a valid UUID'),

  body('first_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),

  body('last_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must not exceed 50 characters'),

  body('mobile_phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Mobile phone must not exceed 50 characters'),

  body('title')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Title must not exceed 150 characters'),

  body('department')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),

  body('linkedin_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL'),

  body('twitter_handle')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Twitter handle must not exceed 50 characters'),

  body('preferred_contact_method')
    .optional({ nullable: true })
    .isIn(['email', 'phone', 'mobile', 'linkedin'])
    .withMessage('Preferred contact method must be one of: email, phone, mobile, linkedin'),

  body('do_not_call')
    .optional()
    .isBoolean()
    .withMessage('Do not call must be a boolean'),

  body('do_not_email')
    .optional()
    .isBoolean()
    .withMessage('Do not email must be a boolean'),

  body('is_primary')
    .optional()
    .isBoolean()
    .withMessage('Is primary must be a boolean'),

  body('is_decision_maker')
    .optional()
    .isBoolean()
    .withMessage('Is decision maker must be a boolean'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'bounced', 'unsubscribed', 'archived'])
    .withMessage('Status must be one of: active, inactive, bounced, unsubscribed, archived'),

  body('lifecycle_stage')
    .optional({ nullable: true })
    .isIn(['lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'evangelist'])
    .withMessage('Lifecycle stage must be one of: lead, marketing_qualified, sales_qualified, opportunity, customer, evangelist'),

  body('account_id')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),

  body('assigned_to')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Assigned to must be a valid UUID'),

  body('reporting_to')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Reporting to must be a valid UUID'),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters'),

  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),

  body('custom_fields')
    .optional()
    .isObject()
    .withMessage('Custom fields must be an object')
];

/**
 * Validation rules for contact ID parameter
 */
const contactIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Contact ID must be a valid UUID')
];

/**
 * Validation rules for linking contact to lead
 */
const linkToLeadValidation = [
  param('id')
    .isUUID()
    .withMessage('Contact ID must be a valid UUID'),

  param('leadId')
    .isUUID()
    .withMessage('Lead ID must be a valid UUID'),

  body('is_primary')
    .optional()
    .isBoolean()
    .withMessage('Is primary must be a boolean'),

  body('role')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Role must not exceed 100 characters')
];

/**
 * Validation rules for duplicate search
 */
const findDuplicatesValidation = [
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must not exceed 50 characters'),

  body('first_name')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),

  body('last_name')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters')
];

module.exports = {
  createContactValidation,
  updateContactValidation,
  contactIdValidation,
  linkToLeadValidation,
  findDuplicatesValidation
};

