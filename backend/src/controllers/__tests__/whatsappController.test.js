/**
 * WhatsApp Controller Tests
 * Tests for WhatsApp API endpoints
 */

const request = require('supertest');
const app = require('../../app');
const whatsappSendService = require('../../services/whatsappSendService');
const whatsappMetaService = require('../../services/whatsappMetaService');

jest.mock('../../services/whatsappSendService');
jest.mock('../../services/whatsappMetaService');
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'user-123', company_id: 'company-123' };
    next();
  }
}));

describe('WhatsApp Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/whatsapp/send/text', () => {
    it('should send text message successfully', async () => {
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123',
        status: 'sent'
      });

      const response = await request(app)
        .post('/api/whatsapp/send/text')
        .send({
          to: '919876543210',
          message: 'Hello from test',
          lead_id: 'lead-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBe('wamid.test123');
      expect(whatsappSendService.sendTextMessage).toHaveBeenCalledWith({
        to: '919876543210',
        message: 'Hello from test',
        companyId: 'company-123',
        userId: 'user-123',
        leadId: 'lead-123'
      });
    });

    it('should return 400 for missing phone number', async () => {
      const response = await request(app)
        .post('/api/whatsapp/send/text')
        .send({
          message: 'Hello'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing message', async () => {
      const response = await request(app)
        .post('/api/whatsapp/send/text')
        .send({
          to: '919876543210'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: false,
        error: 'Failed to send message'
      });

      const response = await request(app)
        .post('/api/whatsapp/send/text')
        .send({
          to: '919876543210',
          message: 'Test'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to send');
    });
  });

  describe('POST /api/whatsapp/send/template', () => {
    it('should send template message successfully', async () => {
      whatsappSendService.sendTemplateMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.template123'
      });

      const response = await request(app)
        .post('/api/whatsapp/send/template')
        .send({
          to: '919876543210',
          template_name: 'welcome',
          language: 'en',
          parameters: ['John', 'Product']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(whatsappSendService.sendTemplateMessage).toHaveBeenCalled();
    });

    it('should return 400 for missing template name', async () => {
      const response = await request(app)
        .post('/api/whatsapp/send/template')
        .send({
          to: '919876543210',
          language: 'en'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/whatsapp/messages', () => {
    it('should get messages with filters', async () => {
      const mockMessages = [
        { id: 'msg1', content: 'Hello' },
        { id: 'msg2', content: 'Hi there' }
      ];

      whatsappSendService.getMessages = jest.fn().mockResolvedValue({
        success: true,
        messages: mockMessages,
        total: 2
      });

      const response = await request(app)
        .get('/api/whatsapp/messages')
        .query({ lead_id: 'lead-123', limit: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toHaveLength(2);
    });
  });

  describe('GET /api/whatsapp/messages/:lead_id', () => {
    it('should get messages for specific lead', async () => {
      whatsappSendService.getLeadMessages = jest.fn().mockResolvedValue({
        success: true,
        messages: [
          { id: 'msg1', lead_id: 'lead-123' }
        ]
      });

      const response = await request(app)
        .get('/api/whatsapp/messages/lead-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(whatsappSendService.getLeadMessages).toHaveBeenCalledWith(
        'lead-123',
        'company-123'
      );
    });
  });

  describe('POST /api/whatsapp/templates/sync', () => {
    it('should sync templates from Meta', async () => {
      const mockTemplates = [
        { name: 'hello_world', status: 'APPROVED' },
        { name: 'welcome', status: 'APPROVED' }
      ];

      whatsappMetaService.getTemplates.mockResolvedValue({
        success: true,
        templates: mockTemplates
      });

      whatsappSendService.syncTemplates = jest.fn().mockResolvedValue({
        success: true,
        synced: 2
      });

      const response = await request(app)
        .post('/api/whatsapp/templates/sync')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.synced).toBe(2);
    });
  });

  describe('GET /api/whatsapp/templates', () => {
    it('should get all templates', async () => {
      whatsappSendService.getTemplates = jest.fn().mockResolvedValue({
        success: true,
        templates: [
          { name: 'welcome', status: 'approved' }
        ]
      });

      const response = await request(app)
        .get('/api/whatsapp/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.templates).toBeDefined();
    });

    it('should filter templates by status', async () => {
      whatsappSendService.getTemplates = jest.fn().mockResolvedValue({
        success: true,
        templates: []
      });

      await request(app)
        .get('/api/whatsapp/templates')
        .query({ status: 'approved' })
        .expect(200);

      expect(whatsappSendService.getTemplates).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' })
      );
    });
  });

  describe('GET /api/whatsapp/settings', () => {
    it('should get WhatsApp settings', async () => {
      whatsappSendService.getSettings = jest.fn().mockResolvedValue({
        success: true,
        settings: {
          is_active: true,
          phone_number_id: '123456789'
        }
      });

      const response = await request(app)
        .get('/api/whatsapp/settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.settings).toBeDefined();
    });
  });

  describe('PUT /api/whatsapp/settings', () => {
    it('should update WhatsApp settings', async () => {
      whatsappSendService.updateSettings = jest.fn().mockResolvedValue({
        success: true,
        settings: { is_active: false }
      });

      const response = await request(app)
        .put('/api/whatsapp/settings')
        .send({ is_active: false })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

