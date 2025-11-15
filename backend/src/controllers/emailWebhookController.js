const emailSendService = require('../services/emailSendService');
const ApiError = require('../utils/ApiError');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Email Webhook Controller
 * Handles webhooks from email providers (Postmark, SendGrid, etc.)
 * Extends BaseController for standardized patterns
 */
class EmailWebhookController extends BaseController {
  /**
   * Handle Postmark webhook
   * POST /api/email/webhooks/postmark
   */
  handlePostmarkWebhook = asyncHandler(async (req, res) => {
    const event = req.body;

    console.log('[POSTMARK WEBHOOK]', event.RecordType, event.MessageID);

    // Process the webhook
    const result = await emailSendService.processWebhook('postmark', event);

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  });

  /**
   * Handle SendGrid webhook (future)
   * POST /api/email/webhooks/sendgrid
   */
  handleSendGridWebhook = asyncHandler(async (req, res) => {
    const events = req.body; // SendGrid sends array of events

    console.log('[SENDGRID WEBHOOK] Received', events.length, 'events');

    // Process each event (errors handled per event to continue processing)
    for (const event of events) {
      try {
        await emailSendService.processWebhook('sendgrid', event);
      } catch (error) {
        console.error('Error processing SendGrid event:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhooks processed'
    });
  });

  /**
   * Test webhook endpoint
   * GET /api/email/webhooks/test
   */
  testWebhook = asyncHandler(async (req, res) => {
    this.success(res, {
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString()
    }, 200);
  });
}

module.exports = new EmailWebhookController();

