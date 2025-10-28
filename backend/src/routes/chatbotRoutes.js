const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/authMiddleware');

// All chatbot routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/chatbot/message
 * @desc    Process chatbot message
 * @access  Private
 */
router.post('/message', chatbotController.processMessage);

/**
 * @route   POST /api/chatbot/confirm
 * @desc    Confirm and execute pending action
 * @access  Private
 */
router.post('/confirm', chatbotController.confirmAction);

/**
 * @route   DELETE /api/chatbot/history
 * @desc    Clear conversation history
 * @access  Private
 */
router.delete('/history', chatbotController.clearHistory);

module.exports = router;