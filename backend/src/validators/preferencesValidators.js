const { body } = require('express-validator');

/**
 * Validation rules for updating user preferences
 */
const validatePreferencesUpdate = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system'),

  body('items_per_page')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Items per page must be between 10 and 100'),

  body('default_view')
    .optional()
    .isIn(['list', 'grid', 'kanban'])
    .withMessage('Default view must be list, grid, or kanban'),

  body('dashboard_widgets')
    .optional()
    .isObject()
    .withMessage('Dashboard widgets must be an object'),

  body('email_notifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),

  body('email_lead_assigned')
    .optional()
    .isBoolean()
    .withMessage('Email lead assigned must be a boolean'),

  body('email_lead_updated')
    .optional()
    .isBoolean()
    .withMessage('Email lead updated must be a boolean'),

  body('email_task_assigned')
    .optional()
    .isBoolean()
    .withMessage('Email task assigned must be a boolean'),

  body('email_task_due')
    .optional()
    .isBoolean()
    .withMessage('Email task due must be a boolean'),

  body('email_daily_digest')
    .optional()
    .isBoolean()
    .withMessage('Email daily digest must be a boolean'),

  body('email_weekly_digest')
    .optional()
    .isBoolean()
    .withMessage('Email weekly digest must be a boolean'),

  body('in_app_notifications')
    .optional()
    .isBoolean()
    .withMessage('In-app notifications must be a boolean'),

  body('date_format')
    .optional()
    .isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
    .withMessage('Date format must be MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD'),

  body('time_format')
    .optional()
    .isIn(['12h', '24h'])
    .withMessage('Time format must be 12h or 24h'),

  body('timezone')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Timezone must be between 2 and 100 characters'),

  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de'])
    .withMessage('Language must be one of: en, es, fr, de')
];

module.exports = {
  validatePreferencesUpdate
};
