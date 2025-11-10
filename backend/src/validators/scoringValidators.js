const { body } = require('express-validator');

/**
 * Validation rules for creating/updating scoring rules
 */
const validateScoringRule = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Rule name is required')
    .isLength({ max: 100 })
    .withMessage('Rule name must not exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('rule_type')
    .notEmpty()
    .withMessage('Rule type is required')
    .isIn(['activity', 'field', 'engagement'])
    .withMessage('Rule type must be one of: activity, field, engagement'),

  // Activity-based rules
  body('activity_type')
    .if(body('rule_type').equals('activity'))
    .notEmpty()
    .withMessage('Activity type is required for activity-based rules')
    .isIn([
      'email_opened',
      'email_clicked',
      'call',
      'meeting',
      'form_submit',
      'note',
      'task',
      'stage_change',
      'assignment_change'
    ])
    .withMessage('Invalid activity type'),

  // Field-based rules
  body('field_name')
    .if(body('rule_type').equals('field'))
    .notEmpty()
    .withMessage('Field name is required for field-based rules')
    .isIn([
      'deal_value',
      'source',
      'status',
      'priority',
      'company',
      'email',
      'phone'
    ])
    .withMessage('Invalid field name'),

  body('condition_operator')
    .if(body('rule_type').equals('field'))
    .notEmpty()
    .withMessage('Condition operator is required for field-based rules')
    .isIn(['>', '<', '>=', '<=', '=', '==', '!=', '<>'])
    .withMessage('Invalid condition operator'),

  body('condition_value')
    .if(body('rule_type').equals('field'))
    .notEmpty()
    .withMessage('Condition value is required for field-based rules')
    .isLength({ max: 100 })
    .withMessage('Condition value must not exceed 100 characters'),

  // Score value
  body('score_value')
    .notEmpty()
    .withMessage('Score value is required')
    .isInt({ min: -100, max: 100 })
    .withMessage('Score value must be an integer between -100 and 100'),

  // Active status
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

module.exports = {
  validateScoringRule
};
