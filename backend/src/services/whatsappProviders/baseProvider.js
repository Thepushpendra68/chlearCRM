const ApiError = require('../../utils/ApiError');

/**
 * Base WhatsApp Provider Interface
 * All WhatsApp BSP providers must implement this interface
 */
class BaseWhatsAppProvider {
  constructor(config) {
    this.config = config;
    this.providerName = 'base';
  }

  /**
   * Initialize provider with configuration
   * @param {object} config - Provider configuration
   */
  async initialize(config) {
    throw new Error('initialize() must be implemented by provider');
  }

  /**
   * Send text message
   * @param {string} to - WhatsApp ID (phone number)
   * @param {string} message - Message text
   * @returns {object} { success: boolean, messageId: string, data: object }
   */
  async sendTextMessage(to, message) {
    throw new Error('sendTextMessage() must be implemented by provider');
  }

  /**
   * Send template message
   * @param {string} to - WhatsApp ID
   * @param {string} templateName - Template name
   * @param {string} language - Template language (default: 'en')
   * @param {array} parameters - Template parameters
   * @returns {object} { success: boolean, messageId: string, data: object }
   */
  async sendTemplateMessage(to, templateName, language = 'en', parameters = []) {
    throw new Error('sendTemplateMessage() must be implemented by provider');
  }

  /**
   * Send media message
   * @param {string} to - WhatsApp ID
   * @param {string} mediaType - 'image', 'video', 'audio', 'document'
   * @param {string} mediaUrl - Public URL of media
   * @param {string} caption - Optional caption
   * @returns {object} { success: boolean, messageId: string, data: object }
   */
  async sendMediaMessage(to, mediaType, mediaUrl, caption = null) {
    throw new Error('sendMediaMessage() must be implemented by provider');
  }

  /**
   * Send interactive message
   * @param {string} to - WhatsApp ID
   * @param {object} interactiveData - Interactive message structure
   * @returns {object} { success: boolean, messageId: string, data: object }
   */
  async sendInteractiveMessage(to, interactiveData) {
    throw new Error('sendInteractiveMessage() must be implemented by provider');
  }

  /**
   * Get templates
   * @returns {object} { success: boolean, templates: array }
   */
  async getTemplates() {
    throw new Error('getTemplates() must be implemented by provider');
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature
   * @param {string} payload - Request payload
   * @returns {boolean} True if signature is valid
   */
  async verifyWebhookSignature(signature, payload) {
    throw new Error('verifyWebhookSignature() must be implemented by provider');
  }

  /**
   * Normalize phone number (provider-specific)
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone number
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    // Default: remove +, spaces, hyphens, parentheses
    return phone.replace(/[+\s-()]/g, '');
  }

  /**
   * Validate configuration
   * @param {object} config - Configuration to validate
   * @returns {object} { valid: boolean, errors: array }
   */
  validateConfig(config) {
    return { valid: true, errors: [] };
  }
}

module.exports = BaseWhatsAppProvider;

