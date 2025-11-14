/**
 * WhatsApp Provider Manager Tests
 * Tests for provider management and selection
 */

const providerManager = require('../providerManager');
const MetaWhatsAppProvider = require('../metaProvider');
const TwilioWhatsAppProvider = require('../twilioProvider');
const { supabaseAdmin } = require('../../../config/supabase');
const ApiError = require('../../../utils/ApiError');

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn()
            }))
          }))
        }))
      }))
    }))
  }
}));

jest.mock('../metaProvider');
jest.mock('../twilioProvider');

describe('WhatsApp Provider Manager', () => {
  const mockCompanyId = 'company-123';

  beforeEach(() => {
    jest.clearAllMocks();
    providerManager.clearAllCache();
  });

  describe('getProvider', () => {
    it('should get Meta provider for company', async () => {
      const mockSettings = {
        id: 'settings-123',
        provider: 'meta',
        config: {
          access_token: 'test_token',
          phone_number_id: '123456789',
          business_account_id: '987654321',
          app_secret: 'test_secret'
        },
        is_active: true
      };

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockSettings,
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      const mockProvider = {
        initialize: jest.fn().mockResolvedValue(),
        sendTextMessage: jest.fn()
      };

      MetaWhatsAppProvider.mockImplementation(() => mockProvider);

      const provider = await providerManager.getProvider(mockCompanyId);

      expect(provider).toBeDefined();
      expect(MetaWhatsAppProvider).toHaveBeenCalled();
      expect(mockProvider.initialize).toHaveBeenCalledWith(mockSettings.config);
    });

    it('should get Twilio provider for company', async () => {
      const mockSettings = {
        id: 'settings-123',
        provider: 'twilio',
        config: {
          account_sid: 'AC123',
          auth_token: 'token123',
          whatsapp_from: 'whatsapp:+1234567890'
        },
        is_active: true
      };

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockSettings,
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      const mockProvider = {
        initialize: jest.fn().mockResolvedValue(),
        sendTextMessage: jest.fn()
      };

      TwilioWhatsAppProvider.mockImplementation(() => mockProvider);

      const provider = await providerManager.getProvider(mockCompanyId);

      expect(provider).toBeDefined();
      expect(TwilioWhatsAppProvider).toHaveBeenCalled();
      expect(mockProvider.initialize).toHaveBeenCalledWith(mockSettings.config);
    });

    it('should cache provider instances', async () => {
      const mockSettings = {
        provider: 'meta',
        config: {
          access_token: 'test_token',
          phone_number_id: '123456789'
        },
        is_active: true
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockSettings,
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      const mockProvider = {
        initialize: jest.fn().mockResolvedValue()
      };

      MetaWhatsAppProvider.mockImplementation(() => mockProvider);

      // First call
      const provider1 = await providerManager.getProvider(mockCompanyId);
      
      // Second call - should use cache
      const provider2 = await providerManager.getProvider(mockCompanyId);

      expect(provider1).toBe(provider2);
      expect(MetaWhatsAppProvider).toHaveBeenCalledTimes(1);
    });

    it('should throw error if integration not configured', async () => {
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      await expect(providerManager.getProvider(mockCompanyId)).rejects.toThrow(
        'WhatsApp integration not configured'
      );
    });

    it('should throw error for unsupported provider', async () => {
      const mockSettings = {
        provider: 'unsupported',
        config: {},
        is_active: true
      };

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockSettings,
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      await expect(providerManager.getProvider(mockCompanyId)).rejects.toThrow(
        'Unsupported WhatsApp provider'
      );
    });
  });

  describe('clearCache', () => {
    it('should clear provider cache for company', async () => {
      const mockSettings = {
        provider: 'meta',
        config: {
          access_token: 'test_token',
          phone_number_id: '123456789'
        },
        is_active: true
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockSettings,
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      const mockProvider = {
        initialize: jest.fn().mockResolvedValue()
      };

      MetaWhatsAppProvider.mockImplementation(() => mockProvider);

      // Get provider (cached)
      await providerManager.getProvider(mockCompanyId);
      
      // Clear cache
      providerManager.clearCache(mockCompanyId);

      // Get again (should create new instance)
      await providerManager.getProvider(mockCompanyId);

      expect(MetaWhatsAppProvider).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of available providers', () => {
      const providers = providerManager.getAvailableProviders();
      
      expect(providers).toContain('meta');
      expect(providers).toContain('twilio');
      expect(Array.isArray(providers)).toBe(true);
    });
  });

  describe('validateProviderConfig', () => {
    it('should validate Meta provider config', () => {
      const validConfig = {
        access_token: 'test_token',
        phone_number_id: '123456789'
      };

      const result = providerManager.validateProviderConfig('meta', validConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid Meta config', () => {
      const invalidConfig = {
        access_token: 'test_token'
        // Missing phone_number_id
      };

      const result = providerManager.validateProviderConfig('meta', invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate Twilio provider config', () => {
      const validConfig = {
        account_sid: 'AC123',
        auth_token: 'token123',
        whatsapp_from: 'whatsapp:+1234567890'
      };

      const result = providerManager.validateProviderConfig('twilio', validConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for unknown provider', () => {
      const result = providerManager.validateProviderConfig('unknown', {});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown provider: unknown');
    });
  });
});

