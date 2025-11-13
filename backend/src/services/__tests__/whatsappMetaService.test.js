/**
 * WhatsApp Meta Service Tests
 * Tests for Meta WhatsApp Business API integration
 */

// Set up test environment variables
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

const whatsappMetaService = require('../whatsappMetaService');
const axios = require('axios');

jest.mock('axios');

describe('WhatsApp Meta Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.META_WHATSAPP_ACCESS_TOKEN = 'test_token';
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = '123456789';
    process.env.META_WHATSAPP_APP_SECRET = 'test_secret';
  });

  describe('sendTextMessage', () => {
    it('should send a text message successfully', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'wamid.test123' }]
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await whatsappMetaService.sendTextMessage('919876543210', 'Hello World');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wamid.test123');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          to: '919876543210',
          type: 'text',
          text: { body: 'Hello World' }
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      const result = await whatsappMetaService.sendTextMessage('919876543210', 'Hello');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    it('should validate phone number', async () => {
      const result = await whatsappMetaService.sendTextMessage('', 'Hello');

      expect(result.success).toBe(false);
      expect(result.error).toContain('phone number');
    });

    it('should validate message content', async () => {
      const result = await whatsappMetaService.sendTextMessage('919876543210', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('message');
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send a template message successfully', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'wamid.template123' }]
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await whatsappMetaService.sendTemplateMessage(
        '919876543210',
        'hello_world',
        'en',
        ['John']
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wamid.template123');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          messaging_product: 'whatsapp',
          to: '919876543210',
          type: 'template',
          template: expect.objectContaining({
            name: 'hello_world',
            language: { code: 'en' }
          })
        }),
        expect.any(Object)
      );
    });

    it('should handle template with parameters', async () => {
      const mockResponse = {
        data: { messages: [{ id: 'wamid.test' }] }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await whatsappMetaService.sendTemplateMessage(
        '919876543210',
        'welcome_message',
        'en',
        ['John', 'Product']
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          template: expect.objectContaining({
            components: expect.arrayContaining([
              expect.objectContaining({
                type: 'body',
                parameters: expect.arrayContaining([
                  expect.objectContaining({ type: 'text', text: 'John' }),
                  expect.objectContaining({ type: 'text', text: 'Product' })
                ])
              })
            ])
          })
        }),
        expect.anything()
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = require('crypto')
        .createHmac('sha256', 'test_secret')
        .update(payload)
        .digest('hex');

      const result = whatsappMetaService.verifyWebhookSignature(
        payload,
        `sha256=${signature}`
      );

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const result = whatsappMetaService.verifyWebhookSignature(
        payload,
        'sha256=invalid_signature'
      );

      expect(result).toBe(false);
    });

    it('should reject missing signature', () => {
      const result = whatsappMetaService.verifyWebhookSignature('{}', '');
      expect(result).toBe(false);
    });
  });

  describe('getTemplates', () => {
    it('should fetch templates successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { name: 'hello_world', status: 'APPROVED' },
            { name: 'welcome', status: 'APPROVED' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await whatsappMetaService.getTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].name).toBe('hello_world');
    });

    it('should handle API errors when fetching templates', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await whatsappMetaService.getTemplates();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });
  });

  describe('sendMediaMessage', () => {
    it('should send image message successfully', async () => {
      const mockResponse = {
        data: { messages: [{ id: 'wamid.media123' }] }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await whatsappMetaService.sendMediaMessage(
        '919876543210',
        'image',
        'https://example.com/image.jpg',
        'Test caption'
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'image',
          image: expect.objectContaining({
            link: 'https://example.com/image.jpg',
            caption: 'Test caption'
          })
        }),
        expect.anything()
      );
    });

    it('should validate media type', async () => {
      const result = await whatsappMetaService.sendMediaMessage(
        '919876543210',
        'invalid_type',
        'https://example.com/file'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('media type');
    });
  });
});

