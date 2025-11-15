const { validationResult } = require('express-validator');
const preferencesService = require('../services/preferencesService');
const userService = require('../services/userService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Preferences Controller
 * Handles user preferences management
 * Extends BaseController for standardized patterns
 */
class PreferencesController extends BaseController {
  /**
   * Get current user preferences
   */
  getPreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preferences = await preferencesService.getUserPreferences(userId);

    this.success(res, preferences, 200);
  });

  /**
   * Update current user preferences
   */
  updatePreferences = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const userId = req.user.id;
    const { timezone, language, ...preferencesData } = req.body;

    const preferences = await preferencesService.updateUserPreferences(userId, preferencesData);

    let updatedProfile = null;
    const profileUpdates = {};

    if (timezone !== undefined) {
      profileUpdates.timezone = timezone;
    }

    if (language !== undefined) {
      profileUpdates.language = language;
    }

    if (Object.keys(profileUpdates).length > 0) {
      updatedProfile = await userService.updateUser(userId, profileUpdates, req.user);
    }

    this.success(res, {
      preferences,
      profile: updatedProfile
    }, 200, 'Preferences updated successfully');

    await logAuditEvent(req, {
      action: AuditActions.USER_PREFERENCES_UPDATED,
      resourceType: 'user_preferences',
      resourceId: userId,
      resourceName: req.user.email || userId,
      companyId: req.user.company_id,
      details: {
        updated_fields: Object.keys(preferencesData),
        updated_profile_fields: Object.keys(profileUpdates)
      }
    });
  });

  /**
   * Reset current user preferences to defaults
   */
  resetPreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preferences = await preferencesService.resetUserPreferences(userId);

    this.success(res, preferences, 200, 'Preferences reset to defaults');

    await logAuditEvent(req, {
      action: AuditActions.USER_PREFERENCES_RESET,
      resourceType: 'user_preferences',
      resourceId: userId,
      resourceName: req.user.email || userId,
      companyId: req.user.company_id
    });
  });
}

module.exports = new PreferencesController();
