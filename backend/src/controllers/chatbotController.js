const chatbotService = require("../services/chatbotService");
const ApiError = require("../utils/ApiError");
const { BaseController, asyncHandler } = require("./baseController");
const { verifyPendingActionToken } = require("../utils/actionToken");

/**
 * Chatbot Controller
 * Handles AI chatbot interactions and operations
 * Extends BaseController for standardized patterns
 */
class ChatbotController extends BaseController {
  /**
   * Process chatbot message
   */
  processMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      throw new ApiError("Message is required", 400);
    }

    const result = await chatbotService.processMessage(
      req.user.id,
      message,
      req.user,
    );

    this.success(res, result, 200, "Message processed successfully");
  });

  /**
   * Confirm and execute pending action
   */
  confirmAction = asyncHandler(async (req, res) => {
    const { confirmationToken } = req.body;

    if (!confirmationToken) {
      throw new ApiError("Confirmation token is required", 400);
    }

    const payload = verifyPendingActionToken(confirmationToken);

    if (payload.sub !== req.user.id) {
      throw new ApiError(
        "This confirmation token does not belong to your session",
        403,
      );
    }

    const result = await chatbotService.confirmAction(
      req.user.id,
      payload.action,
      payload.parameters,
      req.user,
    );

    this.success(res, result, 200, "Action executed successfully");
  });

  /**
   * Clear conversation history
   */
  clearHistory = asyncHandler(async (req, res) => {
    chatbotService.clearHistory(req.user.id);

    this.success(res, null, 200, "Conversation history cleared");
  });

  /**
   * Health check with API key validation status
   */
  healthCheck = asyncHandler(async (req, res) => {
    const health = await chatbotService.healthCheck();

    this.success(res, health, 200, "Health check completed");
  });

  /**
   * Get monitoring metrics and logs
   */
  getMetrics = asyncHandler(async (req, res) => {
    const { level, event, since, limit } = req.query;

    // Get metrics
    const metrics = chatbotService.getMetrics();

    // Get filtered logs if requested
    let logs = null;
    if (req.query.logs === "true") {
      logs = chatbotService.exportLogs({
        level: level || undefined,
        event: event || undefined,
        since: since || undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    this.success(res, {
      metrics,
      logs,
      logCount: logs ? logs.length : undefined,
    }, 200, "Metrics retrieved successfully");
  });

  /**
   * Reset monitoring metrics
   */
  resetMetrics = asyncHandler(async (req, res) => {
    chatbotService.resetMetrics();

    this.success(res, null, 200, "Metrics reset successfully");
  });
}

module.exports = new ChatbotController();
