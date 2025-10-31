const emailSendService = require('../services/emailSendService');
const ApiError = require('../utils/ApiError');

/**
 * Email Webhook Controller
 * Handles webhooks from email providers (Postmark, SendGrid, etc.)
 */
class EmailWebhookController {
  /**
   * Handle Postmark webhook
   * POST /api/email/webhooks/postmark
   */
  async handlePostmarkWebhook(req, res, next) {
    try {
      const event = req.body;

      console.log('[POSTMARK WEBHOOK]', event.RecordType, event.MessageID);

      // Process the webhook
      const result = await emailSendService.processWebhook('postmark', event);

      // Always return 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Webhook processed'
      });
    } catch (error) {
      console.error('Error processing Postmark webhook:', error);
      // Still return 200 to prevent retries
      res.status(200).json({
        success: false,
        message: 'Webhook received but processing failed'
      });
    }
  }

  /**
   * Handle SendGrid webhook (future)
   * POST /api/email/webhooks/sendgrid
   */
  async handleSendGridWebhook(req, res, next) {
    try {
      const events = req.body; // SendGrid sends array of events

      console.log('[SENDGRID WEBHOOK] Received', events.length, 'events');

      // Process each event
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
    } catch (error) {
      console.error('Error processing SendGrid webhook:', error);
      res.status(200).json({
        success: false,
        message: 'Webhooks received but processing failed'
      });
    }
  }

  /**
   * Test webhook endpoint
   * GET /api/email/webhooks/test
   */
  async testWebhook(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Webhook endpoint is working',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailWebhookController();

