const { supabaseAdmin } = require('../../config/supabase');
const MetaWhatsAppProvider = require('./metaProvider');
const TwilioWhatsAppProvider = require('./twilioProvider');
const ApiError = require('../../utils/ApiError');

/**
 * WhatsApp Provider Manager
 * Manages multiple BSP providers and provides unified interface
 */
class WhatsAppProviderManager {
  constructor() {
    this.providers = new Map();
    this.providerClasses = new Map();
    this.registerProvider('meta', MetaWhatsAppProvider);
    this.registerProvider('twilio', TwilioWhatsAppProvider);
  }

  /**
   * Register a provider class
   * @param {string} providerName - Provider identifier
   * @param {class} ProviderClass - Provider class extending BaseWhatsAppProvider
   */
  registerProvider(providerName, ProviderClass) {
    this.providerClasses.set(providerName, ProviderClass);
  }

  /**
   * Get provider instance for a company
   * @param {string} companyId - Company ID
   * @returns {BaseWhatsAppProvider} Provider instance
   */
  async getProvider(companyId) {
    try {
      // Check cache first
      const cacheKey = `provider_${companyId}`;
      if (this.providers.has(cacheKey)) {
        return this.providers.get(cacheKey);
      }

      // Get integration settings
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

      if (!settings || !settings.config) {
        throw new ApiError('WhatsApp integration not configured. Please set up WhatsApp in settings.', 400);
      }

      const providerName = settings.provider || 'meta';
      const ProviderClass = this.providerClasses.get(providerName);

      if (!ProviderClass) {
        throw new ApiError(`Unsupported WhatsApp provider: ${providerName}`, 400);
      }

      // Create provider instance
      const provider = new ProviderClass(settings.config);
      await provider.initialize(settings.config);

      // Cache provider
      this.providers.set(cacheKey, provider);

      return provider;
    } catch (error) {
      console.error('Error getting WhatsApp provider:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to get WhatsApp provider', 500);
    }
  }

  /**
   * Clear provider cache for a company
   * @param {string} companyId - Company ID
   */
  clearCache(companyId) {
    const cacheKey = `provider_${companyId}`;
    this.providers.delete(cacheKey);
  }

  /**
   * Clear all provider caches
   */
  clearAllCache() {
    this.providers.clear();
  }

  /**
   * Get list of available providers
   * @returns {array} Array of provider names
   */
  getAvailableProviders() {
    return Array.from(this.providerClasses.keys());
  }

  /**
   * Validate provider configuration
   * @param {string} providerName - Provider name
   * @param {object} config - Configuration to validate
   * @returns {object} { valid: boolean, errors: array }
   */
  validateProviderConfig(providerName, config) {
    const ProviderClass = this.providerClasses.get(providerName);
    if (!ProviderClass) {
      return {
        valid: false,
        errors: [`Unknown provider: ${providerName}`]
      };
    }

    const provider = new ProviderClass(config);
    return provider.validateConfig(config);
  }
}

module.exports = new WhatsAppProviderManager();

