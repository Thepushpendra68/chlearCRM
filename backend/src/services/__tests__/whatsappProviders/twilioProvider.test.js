/**
 * Twilio WhatsApp Provider Tests
 * Tests for Twilio provider implementation
 */

const TwilioWhatsAppProvider = require('../twilioProvider');
const axios = require('axios');
const ApiError = require('../../../utils/ApiError');

jest.mock('axios');

describe('Twilio WhatsApp Provider', () => {
  let provider;
  const mockConfig = {
    account_sid: 'AC1234567890abcdef',
    auth_token: 'test_auth_token',
    whatsapp_from: 'whatsapp:+1234567890'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new TwilioWhatsAppProvider(mockConfig);
  });

  describe('initialize', () => {
    it('should initialize provider successfully', async () => {
      axios.get.mockResolvedValue({
        data: { sid: 'AC1234567890abcdef' }
      });

      await provider.initialize(mockConfig);

      expect(provider.accountSid).toBe('AC1234567890abcdef');
      expect(provider.authToken).toBe('test_auth_token');
      expect(provider.whatsappFrom).toBe('whatsapp:+1234567890');
    });

    it('should add whatsapp: prefix if missing', async () => {
      const configWithoutPrefix = {
        ...mockConfig,
        whatsapp_from: '+1234567890'
      };

      axios.get.mockResolvedValue({
        data: { sid: 'AC1234567890abcdef' }
      });

      await provider.initialize(configWithoutPrefix);

      expect(provider.whatsappFrom).toBe('whatsapp:+1234567890');
    });

    it('should throw error if credentials are invalid', async () => {
      axios.get.mockRejectedValue({
        response: { status: 401 }
      });

      await expect(provider.initialize(mockConfig)).rejects.toThrow(
        'Twilio credentials are invalid'
      );
    });

    it('should throw error if required fields are missing', async () => {
      await expect(provider.initialize({})).rejects.toThrow(
        'Twilio WhatsApp requires account_sid, auth_token, and whatsapp_from'
      );
    });
  });

  describe('sendTextMessage', () => {
    beforeEach(async () => {
      axios.get.mockResolvedValue({
        data: { sid: 'AC1234567890abcdef' }
      });
      await provider.initialize(mockConfig);
    });

    it('should send text message successfully', async () => {
      const mockResponse = {
        data: {
          sid: 'SM1234567890abcdef',
          status: 'queued'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await provider.sendTextMessage('+919876543210', 'Hello World');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM1234567890abcdef');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/Messages.json'),
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic')
          })
        })
      );
    });

    it('should normalize phone number', async () => {
      const mockResponse = {
        data: {
          sid: 'SM1234567890abcdef',
          status: 'queued'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      await provider.sendTextMessage('91 98765 43210', 'Hello');

      const callArgs = axios.post.mock.calls[0];
      const formData = callArgs[1];
      
      expect(formData.toString()).toContain('whatsapp:');
    });
  });

  describe('sendTemplateMessage', () => {
    beforeEach(async () => {
      axios.get.mockResolvedValue({
        data: { sid: 'AC1234567890abcdef' }
      });
      await provider.initialize(mockConfig);
    });

    it('should send template message with Content SID', async () => {
      const mockResponse = {
        data: {
          sid: 'SM1234567890abcdef',
          status: 'queued'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await provider.sendTemplateMessage(
        '+919876543210',
        'HX1234567890abcdef', // Content SID
        'en',
        ['John', 'Product']
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM1234567890abcdef');
    });

    it('should throw error if template name is not Content SID', async () => {
      await expect(
        provider.sendTemplateMessage('+919876543210', 'template_name', 'en')
      ).rejects.toThrow('Twilio requires Content SID');
    });
  });

  describe('sendMediaMessage', () => {
    beforeEach(async () => {
      axios.get.mockResolvedValue({
        data: { sid: 'AC1234567890abcdef' }
      });
      await provider.initialize(mockConfig);
    });

    it('should send media message successfully', async () => {
      const mockResponse = {
        data: {
          sid: 'SM1234567890abcdef',
          status: 'queued'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await provider.sendMediaMessage(
        '+919876543210',
        'image',
        'https://example.com/image.jpg',
        'Check this out!'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM1234567890abcdef');
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should normalize phone numbers to E.164 format', () => {
      expect(provider.normalizePhoneNumber('+91 98765 43210')).toBe('+919876543210');
      expect(provider.normalizePhoneNumber('91-98765-43210')).toBe('+191-98765-43210');
      expect(provider.normalizePhoneNumber('00919876543210')).toBe('+919876543210');
    });

    it('should handle already normalized numbers', () => {
      expect(provider.normalizePhoneNumber('+919876543210')).toBe('+919876543210');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const result = provider.validateConfig(mockConfig);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing fields', () => {
      const result = provider.validateConfig({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('account_sid is required');
      expect(result.errors).toContain('auth_token is required');
      expect(result.errors).toContain('whatsapp_from is required');
    });
  });
});

