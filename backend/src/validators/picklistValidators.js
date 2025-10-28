const { body } = require('express-validator');
const { LEAD_PICKLIST_TYPES, normalizeValue } = require('../services/picklistService');

const scopeValidator = body('scope')
  .optional()
  .isIn(['global', 'company'])
  .withMessage('Scope must be either global or company');

const createLeadPicklistValidators = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .bail()
    .isIn(LEAD_PICKLIST_TYPES)
    .withMessage(`Type must be one of: ${LEAD_PICKLIST_TYPES.join(', ')}`),
  body('label')
    .trim()
    .notEmpty()
    .withMessage('Label is required'),
  body('value')
    .optional()
    .isString()
    .withMessage('Value must be a string')
    .bail()
    .custom((value) => {
      if (!normalizeValue(value)) {
        throw new Error('Value must contain at least one alphanumeric character');
      }

      return true;
    }),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('sortOrder must be a positive integer')
    .toInt(),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean(),
  scopeValidator
];

const updateLeadPicklistValidators = [
  body('label')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Label must not be empty when provided'),
  body('value')
    .optional()
    .isString()
    .withMessage('Value must be a string')
    .bail()
    .custom((value) => {
      if (!normalizeValue(value)) {
        throw new Error('Value must contain at least one alphanumeric character');
      }
      return true;
    }),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('sortOrder must be a positive integer')
    .toInt(),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
    .toBoolean(),
  scopeValidator
];

const reorderLeadPicklistValidators = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .bail()
    .isIn(LEAD_PICKLIST_TYPES)
    .withMessage(`Type must be one of: ${LEAD_PICKLIST_TYPES.join(', ')}`),
  body('orderedIds')
    .isArray({ min: 1 })
    .withMessage('orderedIds must be an array with at least one element'),
  body('orderedIds.*')
    .isUUID()
    .withMessage('Each orderedIds entry must be a valid UUID'),
  scopeValidator
];

module.exports = {
  createLeadPicklistValidators,
  updateLeadPicklistValidators,
  reorderLeadPicklistValidators
};
