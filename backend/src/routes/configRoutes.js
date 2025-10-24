/**
 * Configuration Routes
 * Exposes industry configuration to the frontend
 */

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticate } = require('../middleware/authMiddleware');

// All configuration routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/config/industry
 * @desc    Get industry configuration for current user's company
 * @access  Private
 */
router.get('/industry', configController.getIndustryConfig);

/**
 * @route   GET /api/config/form-layout
 * @desc    Get form layout with field definitions
 * @access  Private
 */
router.get('/form-layout', configController.getFormLayout);

/**
 * @route   GET /api/config/industries
 * @desc    Get list of available industries
 * @access  Private
 */
router.get('/industries', configController.getAvailableIndustries);

/**
 * @route   GET /api/config/terminology
 * @desc    Get terminology labels for current industry
 * @access  Private
 */
router.get('/terminology', configController.getTerminology);

/**
 * @route   GET /api/config/fields
 * @desc    Get field definitions (core + custom)
 * @access  Private
 */
router.get('/fields', configController.getFieldDefinitions);

module.exports = router;
