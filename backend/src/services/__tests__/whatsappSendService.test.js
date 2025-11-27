/**
 * WhatsApp Send Service Tests
 * Tests for CRM WhatsApp sending layer
 */

// Set up test environment variables
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

const whatsappSendService = require('../whatsappSendService');
const whatsappMetaService = require('../whatsappMetaService');
const activityService = require('../activityService');
const { supabaseAdmin } = require('../../config/supabase');

jest.mock('../whatsappMetaService');
jest.mock('../activityService');
jest.mock('../../config/supabase', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null })
      }))
    }))
  };
  return {
    supabaseAdmin: mockSupabase
  };
});

describe('WhatsApp Send Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock updateConversation method
    whatsappSendService.updateConversation = jest.fn().mockResolvedValue({ success: true });
  });

  describe('sendTextMessage', () => {
    it('should send text message and log to database', async () => {
      // Mock Meta API success
      whatsappMetaService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123'
      });

      // Mock database insert
      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'db-message-id' },
              error: null
            })
          }))
        }))
      });

      // Mock activity logging
      activityService.createActivity.mockResolvedValue({
        success: true,
        activity: { id: 'activity-id' }
      });

      const result = await whatsappSendService.sendTextMessage({
        to: '919876543210',
        message: 'Test message',
        companyId: 'company-123',
        leadId: 'lead-123'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wamid.test123');
      expect(whatsappMetaService.sendTextMessage).toHaveBeenCalledWith(
        '919876543210',
        'Test message'
      );
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(activityService.createActivity).toHaveBeenCalled();
    });

    it('should handle Meta API errors', async () => {
      whatsappMetaService.sendTextMessage.mockResolvedValue({
        success: false,
        error: 'API Error'
      });

      const result = await whatsappSendService.sendTextMessage({
        to: '919876543210',
        message: 'Test',
        companyId: 'company-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    it('should validate required parameters', async () => {
      const result = await whatsappSendService.sendTextMessage({
        to: '',
        message: 'Test',
        companyId: 'company-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should create conversation if not exists', async () => {
      whatsappMetaService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test'
      });

      mockSupabase.select.mockResolvedValue({
        data: null,
        error: null
      });

      mockSupabase.insert.mockResolvedValue({
        data: { id: 'message-id' },
        error: null
      });

      await whatsappSendService.sendTextMessage({
        to: '919876543210',
        message: 'First message',
        companyId: 'company-123',
        leadId: 'lead-123'
      });

      // Should call insert for both message and conversation
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send template message successfully', async () => {
      whatsappMetaService.sendTemplateMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.template123'
      });

      mockSupabase.insert.mockResolvedValue({
        data: { id: 'db-id' },
        error: null
      });

      const result = await whatsappSendService.sendTemplateMessage({
        to: '919876543210',
        templateName: 'welcome',
        language: 'en',
        parameters: ['John'],
        companyId: 'company-123'
      });

      expect(result.success).toBe(true);
      expect(whatsappMetaService.sendTemplateMessage).toHaveBeenCalledWith(
        '919876543210',
        'welcome',
        'en',
        ['John']
      );
    });

    it('should log template parameters in database', async () => {
      whatsappMetaService.sendTemplateMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test'
      });

      mockSupabase.insert.mockResolvedValue({
        data: { id: 'db-id' },
        error: null
      });

      await whatsappSendService.sendTemplateMessage({
        to: '919876543210',
        templateName: 'welcome',
        language: 'hi',
        parameters: ['राज', 'उत्पाद'],
        companyId: 'company-123'
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          template_name: 'welcome',
          template_language: 'hi',
          template_params: ['राज', 'उत्पाद']
        })
      );
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message status', async () => {
      mockSupabase.update.mockResolvedValue({
        data: { id: 'message-id' },
        error: null
      });

      const result = await whatsappSendService.updateMessageStatus(
        'wamid.test',
        'delivered',
        'company-123'
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'delivered',
          delivered_at: expect.any(String)
        })
      );
    });

    it('should update read status with timestamp', async () => {
      mockSupabase.update.mockResolvedValue({
        data: { id: 'message-id' },
        error: null
      });

      await whatsappSendService.updateMessageStatus(
        'wamid.test',
        'read',
        'company-123'
      );

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'read',
          read_at: expect.any(String)
        })
      );
    });

    it('should handle failed status with error', async () => {
      mockSupabase.update.mockResolvedValue({
        data: { id: 'message-id' },
        error: null
      });

      await whatsappSendService.updateMessageStatus(
        'wamid.test',
        'failed',
        'company-123',
        'Message not delivered'
      );

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Message not delivered'
        })
      );
    });
  });

  describe('sendInteractiveMessage', () => {
    it('should send interactive message and log to database', async () => {
      const interactiveData = {
        type: 'button',
        body: { text: 'What would you like to do?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'action1', title: 'View Leads' } }
          ]
        }
      };

      whatsappMetaService.sendInteractiveMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.interactive123'
      });

      // Mock database chain for insert
      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'db-message-id', company_id: 'company-123', whatsapp_id: '919876543210' },
              error: null
            })
          }))
        }))
      });

      activityService.createActivity.mockResolvedValue({
        success: true,
        activity: { id: 'activity-id' }
      });

      const result = await whatsappSendService.sendInteractiveMessage(
        'company-123',
        '919876543210',
        interactiveData,
        { lead_id: 'lead-123' }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wamid.interactive123');
      expect(whatsappMetaService.sendInteractiveMessage).toHaveBeenCalledWith(
        'company-123',
        '919876543210',
        interactiveData
      );
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(whatsappSendService.updateConversation).toHaveBeenCalled();
      expect(activityService.createActivity).toHaveBeenCalled();
    });

    it('should handle Meta API errors', async () => {
      whatsappMetaService.sendInteractiveMessage.mockRejectedValue(
        new Error('API Error')
      );

      await expect(
        whatsappSendService.sendInteractiveMessage(
          'company-123',
          '919876543210',
          { type: 'button', body: { text: 'Test' } },
          {}
        )
      ).rejects.toThrow();
    });

    it('should handle database errors', async () => {
      whatsappMetaService.sendInteractiveMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test'
      });

      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          }))
        }))
      });

      await expect(
        whatsappSendService.sendInteractiveMessage(
          'company-123',
          '919876543210',
          { type: 'button', body: { text: 'Test' } },
          {}
        )
      ).rejects.toThrow();
    });
  });
});

