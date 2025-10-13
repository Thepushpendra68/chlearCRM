const { validationResult } = require('express-validator');
const preferencesService = require('../services/preferencesService');
const userService = require('../services/userService');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get current user preferences
 * @route   GET /api/preferences
 * @access  Private
 */
const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = await preferencesService.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user preferences
 * @route   PUT /api/preferences
 * @access  Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400, errors.array());
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

    res.json({
      success: true,
      data: {
        preferences,
        profile: updatedProfile
      },
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset current user preferences to defaults
 * @route   POST /api/preferences/reset
 * @access  Private
 */
const resetPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = await preferencesService.resetUserPreferences(userId);

    res.json({
      success: true,
      data: preferences,
      message: 'Preferences reset to defaults'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  resetPreferences
};
