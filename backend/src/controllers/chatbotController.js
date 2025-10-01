const chatbotService = require('../services/chatbotService');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Process chatbot message
 * @route   POST /api/chatbot/message
 * @access  Private
 */
const processMessage = async (req, res, next) => {
  try {
    console.log('📨 [CHATBOT] Processing message from user:', req.user.id);
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      throw new ApiError('Message is required', 400);
    }

    console.log('📝 [CHATBOT] User message:', message);

    const result = await chatbotService.processMessage(
      req.user.id,
      message,
      req.user
    );

    console.log('✅ [CHATBOT] Message processed successfully');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ [CHATBOT] Controller error:', error);
    next(error);
  }
};

/**
 * @desc    Confirm and execute pending action
 * @route   POST /api/chatbot/confirm
 * @access  Private
 */
const confirmAction = async (req, res, next) => {
  try {
    const { action, parameters } = req.body;

    if (!action || !parameters) {
      throw new ApiError('Action and parameters are required', 400);
    }

    const result = await chatbotService.confirmAction(
      req.user.id,
      action,
      parameters,
      req.user
    );

    res.json({
      success: true,
      data: result,
      message: 'Action executed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear conversation history
 * @route   DELETE /api/chatbot/history
 * @access  Private
 */
const clearHistory = async (req, res, next) => {
  try {
    chatbotService.clearHistory(req.user.id);

    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processMessage,
  confirmAction,
  clearHistory
};