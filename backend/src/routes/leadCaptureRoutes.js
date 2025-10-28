const express = require('express');
const { authenticateApiKey } = require('../middleware/apiKeyMiddleware');
const { captureLead, captureBulkLeads, getApiInfo } = require('../controllers/leadCaptureController');

const router = express.Router();

// All lead capture routes require API key authentication
router.use(authenticateApiKey);

/**
 * @route   POST /api/v1/capture/lead
 * @desc    Capture a single lead from external source
 * @access  API Key Required
 */
router.post('/lead', captureLead);

/**
 * @route   POST /api/v1/capture/leads/bulk
 * @desc    Capture multiple leads in one request
 * @access  API Key Required
 */
router.post('/leads/bulk', captureBulkLeads);

/**
 * @route   GET /api/v1/capture/info
 * @desc    Get API client configuration info
 * @access  API Key Required
 */
router.get('/info', getApiInfo);

module.exports = router;

