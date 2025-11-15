const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  aiEndpointSecurity,
  adminEndpointSecurity,
  metricsEndpointSecurity
} = require('../middleware/securityMiddleware');

// All chatbot routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/chatbot/message
 * @desc    Process chatbot message with comprehensive security
 * @access  Private
 * @security Input sanitization, XSS protection, rate limiting (20/min), size limit (100KB)
 */
router.post('/message', ...aiEndpointSecurity, chatbotController.processMessage);

/**
 * @route   POST /api/chatbot/confirm
 * @desc    Confirm and execute pending action
 * @access  Private
 * @security Input sanitization, XSS protection, rate limiting (20/min), size limit (100KB)
 */
router.post('/confirm', ...aiEndpointSecurity, chatbotController.confirmAction);

/**
 * @route   DELETE /api/chatbot/history
 * @desc    Clear conversation history
 * @access  Private
 * @security XSS protection, rate limiting (20/min)
 */
router.delete('/history', ...aiEndpointSecurity, chatbotController.clearHistory);

/**
 * @route   GET /api/chatbot/health
 * @desc    Health check with API key validation status
 * @access  Private (Admin only)
 * @security Admin role required, IP allowlist, rate limiting (60/min)
 */
router.get('/health', ...adminEndpointSecurity, chatbotController.healthCheck);

/**
 * @route   GET /api/chatbot/metrics
 * @desc    Get monitoring metrics and logs
 * @access  Private (Admin only)
 * @security Admin role required, rate limiting (30/min)
 */
router.get('/metrics', ...metricsEndpointSecurity, chatbotController.getMetrics);

/**
 * @route   POST /api/chatbot/metrics/reset
 * @desc    Reset monitoring metrics
 * @access  Private (Admin only)
 * @security Admin role required, rate limiting (30/min)
 */
router.post('/metrics/reset', ...metricsEndpointSecurity, chatbotController.resetMetrics);

module.exports = router;
