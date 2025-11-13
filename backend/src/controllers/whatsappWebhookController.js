const whatsappWebhookService = require('../services/whatsappWebhookService');
const whatsappMetaService = require('../services/whatsappMetaService');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Webhook Controller
 * Handles webhooks from Meta WhatsApp Business API
 */
class WhatsAppWebhookController {
  /**
   * Webhook verification (GET request from Meta)
   * GET /api/whatsapp/webhooks/meta
   */
  async verifyWebhook(req, res, next) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ [WHATSAPP] Webhook verified');
        res.status(200).send(challenge);
      } else {
        console.error('❌ [WHATSAPP] Webhook verification failed');
        res.status(403).send('Forbidden');
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle webhook events (POST request from Meta)
   * POST /api/whatsapp/webhooks/meta
   */
  async handleWebhook(req, res, next) {
    try {
      // Verify webhook signature
      const signature = req.headers['x-hub-signature-256'];
      const rawBody = JSON.stringify(req.body);

      // Find company by phone_number_id from webhook
      const phoneNumberId = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
      
      if (!phoneNumberId) {
        return res.status(200).json({ success: false, reason: 'no_phone_number_id' });
      }

      // Get company from integration settings
      // Note: We need to search by phone_number_id in config JSONB
      const { data: allSettings } = await supabaseAdmin
        .from('integration_settings')
        .select('company_id, config')
        .eq('type', 'whatsapp')
        .eq('provider', 'meta')
        .eq('is_active', true);

      // Find matching company by phone_number_id
      let settings = null;
      if (allSettings) {
        settings = allSettings.find(s => s.config?.phone_number_id === phoneNumberId);
      }

      if (!settings) {
        console.warn('No company found for phone number ID:', phoneNumberId);
        return res.status(200).json({ success: false, reason: 'company_not_found' });
      }

      // Verify signature if app_secret is configured
      if (settings.config.app_secret && signature) {
        const isValid = whatsappMetaService.verifyWebhookSignature(
          signature,
          rawBody,
          settings.config.app_secret
        );

        if (!isValid) {
          console.error('❌ [WHATSAPP] Invalid webhook signature');
          return res.status(403).json({ success: false, reason: 'invalid_signature' });
        }
      }

      // Process webhook
      const result = await whatsappWebhookService.processWebhook(settings.company_id, req.body);

      // Always return 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Webhook processed',
        result
      });
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      // Still return 200 to prevent retries
      res.status(200).json({
        success: false,
        message: 'Webhook received but processing failed',
        error: error.message
      });
    }
  }
}

module.exports = new WhatsAppWebhookController();

