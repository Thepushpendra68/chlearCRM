const providerManager = require('./whatsappProviders/providerManager');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Service (Unified)
 * Handles all WhatsApp interactions using provider abstraction
 * Maintains backward compatibility with existing code
 */
class WhatsAppMetaService {
  constructor() {
    // Keep for backward compatibility
    this.apiVersion = 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Get provider for company (uses provider manager)
   */
  async getProvider(companyId) {
    return await providerManager.getProvider(companyId);
  }

  /**
   * Get Meta WhatsApp client for company (backward compatibility)
   * @deprecated Use getProvider() instead
   */
  async getClient(companyId) {
    const provider = await this.getProvider(companyId);
    
    // Return client-like object for backward compatibility
    const settings = await this._getSettings(companyId);
    return {
      accessToken: settings.config.access_token,
      phoneNumberId: settings.config.phone_number_id,
      businessAccountId: settings.config.business_account_id,
      appSecret: settings.config.app_secret,
      apiVersion: this.apiVersion,
      baseUrl: this.baseUrl
    };
  }

  /**
   * Get settings (internal helper)
   */
  async _getSettings(companyId) {
    const { supabaseAdmin } = require('../config/supabase');
    const { data: settings, error } = await supabaseAdmin
      .from('integration_settings')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', 'whatsapp')
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!settings) {
      throw new ApiError('WhatsApp integration not configured. Please set up WhatsApp in settings.', 400);
    }

    return settings;
  }

  /**
   * Send text message
   * @param {string} companyId - Company ID
   * @param {string} to - WhatsApp ID (phone number with country code, no +)
   * @param {string} message - Message text
   * @returns {object} API response with message ID
   */
  async sendTextMessage(companyId, to, message) {
    try {
      const provider = await this.getProvider(companyId);
      return await provider.sendTextMessage(to, message);
    } catch (error) {
      console.error('Error sending WhatsApp text message:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to send WhatsApp message', 500);
    }
  }

  /**
   * Send template message
   * @param {string} companyId - Company ID
   * @param {string} to - WhatsApp ID
   * @param {string} templateName - Template name (must be approved in Meta)
   * @param {string} language - Language code (default: 'en')
   * @param {array} parameters - Template parameters
   * @returns {object} API response
   */
  async sendTemplateMessage(companyId, to, templateName, language = 'en', parameters = []) {
    try {
      const provider = await this.getProvider(companyId);
      return await provider.sendTemplateMessage(to, templateName, language, parameters);
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to send WhatsApp template message', 500);
    }
  }

  /**
   * Send media message (image, video, audio, document)
   * @param {string} companyId - Company ID
   * @param {string} to - WhatsApp ID
   * @param {string} mediaType - 'image', 'video', 'audio', 'document'
   * @param {string} mediaUrl - Public URL of media
   * @param {string} caption - Optional caption
   * @returns {object} API response
   */
  async sendMediaMessage(companyId, to, mediaType, mediaUrl, caption = null) {
    try {
      const provider = await this.getProvider(companyId);
      return await provider.sendMediaMessage(to, mediaType, mediaUrl, caption);
    } catch (error) {
      console.error('Error sending WhatsApp media message:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to send WhatsApp media message', 500);
    }
  }

  /**
   * Send interactive message (buttons or list)
   * @param {string} companyId - Company ID
   * @param {string} to - WhatsApp ID
   * @param {object} interactiveData - Interactive message structure
   * @returns {object} API response
   */
  async sendInteractiveMessage(companyId, to, interactiveData) {
    try {
      const provider = await this.getProvider(companyId);
      return await provider.sendInteractiveMessage(to, interactiveData);
    } catch (error) {
      console.error('Error sending WhatsApp interactive message:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to send WhatsApp interactive message', 500);
    }
  }

  /**
   * Get message media
   * @param {string} companyId - Company ID
   * @param {string} mediaId - Media ID from message
   * @returns {object} Media URL and metadata
   */
  async getMedia(companyId, mediaId) {
    try {
      const client = await this.getClient(companyId);
      
      // First, get media URL
      const url = `${client.baseUrl}/${mediaId}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`
        }
      });

      return {
        success: true,
        url: response.data.url,
        mimeType: response.data.mime_type,
        sha256: response.data.sha256,
        fileSize: response.data.file_size
      };
    } catch (error) {
      console.error('Error getting WhatsApp media:', error.response?.data || error.message);
      throw new ApiError(
        error.response?.data?.error?.message || 'Failed to get WhatsApp media',
        error.response?.status || 500
      );
    }
  }

  /**
   * Download media file
   * @param {string} companyId - Company ID
   * @param {string} mediaUrl - Media URL from getMedia
   * @returns {Buffer} Media file buffer
   */
  async downloadMedia(companyId, mediaUrl) {
    try {
      const client = await this.getClient(companyId);
      
      const response = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`
        },
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading WhatsApp media:', error.message);
      throw new ApiError('Failed to download WhatsApp media', 500);
    }
  }

  /**
   * Mark message as read
   * @param {string} companyId - Company ID
   * @param {string} messageId - Message ID (wamid)
   * @returns {object} API response
   */
  async markAsRead(companyId, messageId) {
    try {
      const client = await this.getClient(companyId);
      
      const url = `${client.baseUrl}/${client.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error marking message as read:', error.response?.data || error.message);
      throw new ApiError(
        error.response?.data?.error?.message || 'Failed to mark message as read',
        error.response?.status || 500
      );
    }
  }

  /**
   * Get template list from Meta
   * @param {string} companyId - Company ID
   * @returns {array} List of approved templates
   */
  async getTemplates(companyId) {
    try {
      const provider = await this.getProvider(companyId);
      return await provider.getTemplates();
    } catch (error) {
      console.error('Error getting WhatsApp templates:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to get WhatsApp templates', 500);
    }
  }

  /**
   * Submit template for approval
   * @param {string} companyId - Company ID
   * @param {object} templateData - Template structure
   * @returns {object} API response
   */
  async submitTemplate(companyId, templateData) {
    try {
      const client = await this.getClient(companyId);
      
      if (!client.businessAccountId) {
        throw new ApiError('Business Account ID not configured', 400);
      }
      
      const url = `${client.baseUrl}/${client.businessAccountId}/message_templates`;
      
      const response = await axios.post(url, templateData, {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        templateId: response.data.id,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      console.error('Error submitting WhatsApp template:', error.response?.data || error.message);
      throw new ApiError(
        error.response?.data?.error?.message || 'Failed to submit WhatsApp template',
        error.response?.status || 500
      );
    }
  }

  /**
   * Verify webhook signature (Meta security)
   * @param {string} signature - X-Hub-Signature-256 header
   * @param {string} payload - Raw request body
   * @param {string} appSecret - App secret
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(signature, payload, appSecret) {
    if (!signature || !appSecret) {
      return false;
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    );
  }

  /**
   * Normalize phone number (remove +, spaces, etc.)
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone number
   */
  normalizePhoneNumber(phone) {
    return phone.replace(/[+\s\-()]/g, '');
  }

  /**
   * Clear client cache for company
   */
  clearCache(companyId) {
    providerManager.clearCache(companyId);
  }
}

module.exports = new WhatsAppMetaService();

