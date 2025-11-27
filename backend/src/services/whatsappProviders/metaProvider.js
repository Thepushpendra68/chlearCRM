const axios = require('axios');
const crypto = require('crypto');
const BaseWhatsAppProvider = require('./baseProvider');
const ApiError = require('../../utils/ApiError');

/**
 * Meta (Facebook) WhatsApp Business API Provider
 */
class MetaWhatsAppProvider extends BaseWhatsAppProvider {
  constructor(config) {
    super(config);
    this.providerName = 'meta';
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = null;
    this.phoneNumberId = null;
    this.businessAccountId = null;
    this.appSecret = null;
  }

  /**
   * Initialize provider
   */
  async initialize(config) {
    if (!config.access_token || !config.phone_number_id) {
      throw new ApiError('Meta WhatsApp requires access_token and phone_number_id', 400);
    }

    this.accessToken = config.access_token;
    this.phoneNumberId = config.phone_number_id;
    this.businessAccountId = config.business_account_id;
    this.appSecret = config.app_secret;

    // Verify credentials by making a test API call
    try {
      await axios.get(`${this.baseUrl}/${this.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        throw new ApiError(
          'WhatsApp access token has expired. Please update your Meta access token in WhatsApp Settings.',
          'WHATSAPP_TOKEN_EXPIRED'
        );
      }
      throw new ApiError('Failed to initialize Meta WhatsApp provider', 500);
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(to, message) {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'Failed to send WhatsApp text message');
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(to, templateName, language = 'en', parameters = []) {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      const components = [];
      if (parameters.length > 0) {
        components.push({
          type: 'body',
          parameters: parameters.map((param, index) => ({
            type: 'text',
            text: String(param)
          }))
        });
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language
          },
          ...(components.length > 0 ? { components } : {})
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'Failed to send WhatsApp template message');
    }
  }

  /**
   * Send media message
   */
  async sendMediaMessage(to, mediaType, mediaUrl, caption = null) {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          ...(caption ? { caption } : {})
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'Failed to send WhatsApp media message');
    }
  }

  /**
   * Send interactive message
   */
  async sendInteractiveMessage(to, interactiveData) {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'interactive',
        interactive: interactiveData
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'Failed to send WhatsApp interactive message');
    }
  }

  /**
   * Get templates
   */
  async getTemplates() {
    try {
      // Use business account ID if available, otherwise use phone number ID
      // Note: Templates are typically accessed via business account ID
      const accountId = this.businessAccountId || this.phoneNumberId;
      
      if (!accountId) {
        throw new ApiError('Business Account ID or Phone Number ID is required to fetch templates', 400);
      }

      const url = `${this.baseUrl}/${accountId}/message_templates`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return {
        success: true,
        templates: response.data.data || []
      };
    } catch (error) {
      console.error('Error fetching templates from Meta:', error.response?.data || error.message);
      this.handleError(error, 'Failed to get WhatsApp templates');
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(signature, payload) {
    if (!this.appSecret) {
      return false;
    }

    try {
      const hash = crypto
        .createHmac('sha256', this.appSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(`sha256=${hash}`)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle API errors
   */
  handleError(error, defaultMessage) {
    console.error(`Meta WhatsApp API Error:`, error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new ApiError(
        'WhatsApp access token has expired. Please update your Meta access token in WhatsApp Settings.',
        'WHATSAPP_TOKEN_EXPIRED'
      );
    }

    const errorMessage = error.response?.data?.error?.message || defaultMessage;
    throw new ApiError(errorMessage, error.response?.status || 500);
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = [];

    if (!config.access_token) {
      errors.push('access_token is required');
    }
    if (!config.phone_number_id) {
      errors.push('phone_number_id is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = MetaWhatsAppProvider;

