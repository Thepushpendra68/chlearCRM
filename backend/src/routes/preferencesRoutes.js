const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { validatePreferencesUpdate } = require('../validators/preferencesValidators');
const {
  getPreferences,
  updatePreferences,
  resetPreferences
} = require('../controllers/preferencesController');

const router = express.Router();

// All preferences routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/preferences
 * @desc    Get current user preferences
 * @access  Private
 */
router.get('/', getPreferences);

/**
 * @route   PUT /api/preferences
 * @desc    Update current user preferences
 * @access  Private
 */
router.put('/', validatePreferencesUpdate, updatePreferences);

/**
 * @route   POST /api/preferences/reset
 * @desc    Reset current user preferences to defaults
 * @access  Private
 */
router.post('/reset', resetPreferences);

module.exports = router;
