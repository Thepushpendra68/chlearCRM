const axios = require('axios');
const BaseWhatsAppProvider = require('./baseProvider');
const ApiError = require('../../utils/ApiError');

/**
 * Twilio WhatsApp Business API Provider
 */
class TwilioWhatsAppProvider extends BaseWhatsAppProvider {
  constructor(config) {
    super(config);
    this.providerName = 'twilio';
    this.baseUrl = 'https://api.twilio.com/2010-04-01';
    this.accountSid = null;
    this.authToken = null;
    this.whatsappFrom = null; // WhatsApp-enabled phone number (format: whatsapp:+1234567890)
  }

  /**
   * Initialize provider
   */
  async initialize(config) {
    if (!config.account_sid || !config.auth_token || !config.whatsapp_from) {
      throw new ApiError('Twilio WhatsApp requires account_sid, auth_token, and whatsapp_from', 400);
    }

    this.accountSid = config.account_sid;
    this.authToken = config.auth_token;
    this.whatsappFrom = config.whatsapp_from;

    // Ensure whatsapp_from is in correct format
    if (!this.whatsappFrom.startsWith('whatsapp:')) {
      this.whatsappFrom = `whatsapp:${this.whatsappFrom}`;
    }

    // Verify credentials by making a test API call
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      await axios.get(`${this.baseUrl}/Accounts/${this.accountSid}.json`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        throw new ApiError(
          'Twilio credentials are invalid. Please check your Account SID and Auth Token.',
          401
        );
      }
      throw new ApiError('Failed to initialize Twilio WhatsApp provider', 500);
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(to, message) {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      const whatsappTo = `whatsapp:${normalizedTo}`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const url = `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append('From', this.whatsappFrom);
      formData.append('To', whatsappTo);
      formData.append('Body', message);

      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        success: true,
        messageId: response.data.sid,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'Failed to send WhatsApp text message');
    }
  }

  /**
   * Send template message
   * Note: Twilio uses Content SID for templates instead of template names
   */
  async sendTemplateMessage(to, templateName, language = 'en', parameters = []) {
    try {
      const normalizedTo = this.normalizePhoneNumber(to);
      const whatsappTo = `whatsapp:${normalizedTo}`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const url = `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`;

      // Twilio uses Content SID for templates
      // If templateName is actually a Content SID, use it directly
      // Otherwise, we'll need to map template names to Content SIDs
      const contentSid = templateName.startsWith('HX') ? templateName : null;

      if (!contentSid) {
        throw new ApiError(
          'Twilio requires Content SID for template messages. Please provide the Content SID instead of template name.',
          400
        );
      }

      const formData = new URLSearchParams();
      formData.append('From', this.whatsappFrom);
      formData.append('To', whatsappTo);
      formData.append('ContentSid', contentSid);

      // Add content variables if provided
      if (parameters.length > 0) {
        parameters.forEach((param, index) => {
          formData.append(`ContentVariables`, JSON.stringify({ [`${index + 1}`]: param }));
        });
      }

      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        success: true,
        messageId: response.data.sid,
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
      const whatsappTo = `whatsapp:${normalizedTo}`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const url = `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append('From', this.whatsappFrom);
      formData.append('To', whatsappTo);
      formData.append('MediaUrl', mediaUrl);

      // Map media types to Twilio's format
      const mediaTypeMap = {
        image: 'image',
        video: 'video',
        audio: 'audio',
        document: 'document'
      };

      // Twilio automatically detects media type from URL, but we can specify
      if (caption) {
        formData.append('Body', caption);
      }

      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        success: true,
        messageId: response.data.sid,
        data: response.data
      };
    } catch (error) {
      this.handleError(error, 'Failed to send WhatsApp media message');
    }
  }

  /**
   * Send interactive message
   * Note: Twilio has limited support for interactive messages via Content API
   */
  async sendInteractiveMessage(to, interactiveData) {
    try {
      // Twilio doesn't support interactive messages the same way Meta does
      // We'll convert to a text message with buttons description
      const normalizedTo = this.normalizePhoneNumber(to);
      const whatsappTo = `whatsapp:${normalizedTo}`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const url = `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`;

      // Extract text from interactive data
      let messageText = '';
      if (interactiveData.body?.text) {
        messageText = interactiveData.body.text;
      }
      if (interactiveData.footer?.text) {
        messageText += `\n\n${interactiveData.footer.text}`;
      }

      const formData = new URLSearchParams();
      formData.append('From', this.whatsappFrom);
      formData.append('To', whatsappTo);
      formData.append('Body', messageText || 'Interactive message (buttons not supported in Twilio)');

      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        success: true,
        messageId: response.data.sid,
        data: response.data,
        warning: 'Twilio has limited support for interactive messages. Sent as text message.'
      };
    } catch (error) {
      this.handleError(error, 'Failed to send WhatsApp interactive message');
    }
  }

  /**
   * Get templates
   * Note: Twilio uses Content API for templates, which requires different approach
   */
  async getTemplates() {
    try {
      // Twilio doesn't have a direct template list endpoint like Meta
      // Templates are managed through Content API and Content SIDs
      // This would require additional setup and Content API access
      return {
        success: true,
        templates: [],
        message: 'Twilio templates are managed via Content API. Please use Content SIDs directly.'
      };
    } catch (error) {
      this.handleError(error, 'Failed to get WhatsApp templates');
    }
  }

  /**
   * Verify webhook signature
   * Twilio uses X-Twilio-Signature header for webhook verification
   */
  async verifyWebhookSignature(signature, payload) {
    if (!this.authToken) {
      return false;
    }

    try {
      const crypto = require('crypto');
      const url = payload.url || ''; // Webhook URL
      
      // Twilio signature verification
      const expectedSignature = crypto
        .createHmac('sha1', this.authToken)
        .update(url + payload.body || '')
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying Twilio webhook signature:', error);
      return false;
    }
  }

  /**
   * Normalize phone number for Twilio
   * Twilio expects E.164 format: +1234567890
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!normalized.startsWith('+')) {
      // If it starts with 00, replace with +
      if (normalized.startsWith('00')) {
        normalized = '+' + normalized.substring(2);
      } else {
        // Assume default country code if not provided (you may want to make this configurable)
        normalized = '+1' + normalized;
      }
    }
    
    return normalized;
  }

  /**
   * Handle API errors
   */
  handleError(error, defaultMessage) {
    console.error(`Twilio WhatsApp API Error:`, error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new ApiError(
        'Twilio credentials are invalid. Please check your Account SID and Auth Token.',
        401
      );
    }

    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.message || defaultMessage;
      throw new ApiError(errorMessage, 400);
    }

    const errorMessage = error.response?.data?.message || defaultMessage;
    throw new ApiError(errorMessage, error.response?.status || 500);
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = [];

    if (!config.account_sid) {
      errors.push('account_sid is required');
    }
    if (!config.auth_token) {
      errors.push('auth_token is required');
    }
    if (!config.whatsapp_from) {
      errors.push('whatsapp_from is required (WhatsApp-enabled phone number)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = TwilioWhatsAppProvider;

