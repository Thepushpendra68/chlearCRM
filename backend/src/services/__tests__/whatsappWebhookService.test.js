/**
 * WhatsApp Webhook Service Tests
 * Tests for webhook event processing including interactive messages
 */

const whatsappWebhookService = require('../whatsappWebhookService');
const whatsappMetaService = require('../whatsappMetaService');
const whatsappSendService = require('../whatsappSendService');
const whatsappAiService = require('../whatsappAiService');
const { supabaseAdmin } = require('../../config/supabase');

jest.mock('../whatsappMetaService');
jest.mock('../whatsappSendService');
jest.mock('../whatsappAiService');
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn(),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn()
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null })
          }))
        }))
      }))
    }))
  }
}));

// Mock normalizePhoneNumber
whatsappMetaService.normalizePhoneNumber = jest.fn((phone) => phone);

describe('WhatsApp Webhook Service', () => {
  const mockCompanyId = 'company-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleIncomingMessages - Interactive Messages', () => {
    it('should handle button reply interactive message', async () => {
      const messages = [
        {
          from: '919876543210',
          id: 'wamid.test123',
          timestamp: '1234567890',
          type: 'interactive',
          interactive: {
            type: 'button_reply',
            button_reply: {
              id: 'action_view_leads',
              title: 'View Leads'
            }
          }
        }
      ];

      const contacts = [{ wa_id: '919876543210', profile: { name: 'Test User' } }];

      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'message-id' },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      // Mock findOrCreateContact method
      whatsappWebhookService.findOrCreateContact = jest.fn().mockResolvedValue({
        lead_id: 'lead-123',
        contact_id: 'contact-123'
      });

      whatsappSendService.logActivity = jest.fn().mockResolvedValue({ success: true });
      whatsappSendService.updateConversation = jest.fn().mockResolvedValue({ success: true });
      whatsappMetaService.markAsRead = jest.fn().mockResolvedValue({ success: true });
      whatsappAiService.isAutoReplyEnabled = jest.fn().mockResolvedValue(true);
      whatsappAiService.processIncomingMessage = jest.fn().mockResolvedValue({
        success: true
      });

      const result = await whatsappWebhookService.handleIncomingMessages(
        mockCompanyId,
        messages,
        contacts
      );

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(whatsappAiService.processIncomingMessage).toHaveBeenCalledWith(
        mockCompanyId,
        '919876543210',
        'View Leads',
        expect.objectContaining({
          lead_id: 'lead-123',
          interactive_response: true
        }),
        expect.any(Object)
      );
    });

    it('should handle list reply interactive message', async () => {
      const messages = [
        {
          from: '919876543210',
          id: 'wamid.test123',
          timestamp: '1234567890',
          type: 'interactive',
          interactive: {
            type: 'list_reply',
            list_reply: {
              id: 'status_new',
              title: 'New Leads',
              description: 'Recently created'
            }
          }
        }
      ];

      const contacts = [{ wa_id: '919876543210', profile: { name: 'Test User' } }];

      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'message-id' },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      whatsappWebhookService.findOrCreateContact = jest.fn().mockResolvedValue({
        lead_id: 'lead-123'
      });

      whatsappSendService.logActivity = jest.fn().mockResolvedValue({ success: true });
      whatsappSendService.updateConversation = jest.fn().mockResolvedValue({ success: true });
      whatsappMetaService.markAsRead = jest.fn().mockResolvedValue({ success: true });
      whatsappAiService.isAutoReplyEnabled = jest.fn().mockResolvedValue(true);
      whatsappAiService.processIncomingMessage = jest.fn().mockResolvedValue({
        success: true
      });

      const result = await whatsappWebhookService.handleIncomingMessages(
        mockCompanyId,
        messages,
        contacts
      );

      expect(result.success).toBe(true);
      expect(whatsappAiService.processIncomingMessage).toHaveBeenCalledWith(
        mockCompanyId,
        '919876543210',
        'New Leads',
        expect.objectContaining({
          interactive_response: true
        }),
        expect.any(Object)
      );
    });

    it('should not process interactive message if auto-reply is disabled', async () => {
      const messages = [
        {
          from: '919876543210',
          id: 'wamid.test123',
          timestamp: '1234567890',
          type: 'interactive',
          interactive: {
            type: 'button_reply',
            button_reply: {
              id: 'action1',
              title: 'View Leads'
            }
          }
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'message-id' },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      whatsappWebhookService.findOrCreateContact = jest.fn().mockResolvedValue({
        lead_id: 'lead-123'
      });

      whatsappSendService.logActivity = jest.fn().mockResolvedValue({ success: true });
      whatsappSendService.updateConversation = jest.fn().mockResolvedValue({ success: true });
      whatsappMetaService.markAsRead = jest.fn().mockResolvedValue({ success: true });
      whatsappAiService.isAutoReplyEnabled = jest.fn().mockResolvedValue(false);

      const result = await whatsappWebhookService.handleIncomingMessages(
        mockCompanyId,
        messages,
        []
      );

      expect(result.success).toBe(true);
      expect(whatsappAiService.processIncomingMessage).not.toHaveBeenCalled();
    });

    it('should handle interactive message processing errors gracefully', async () => {
      const messages = [
        {
          from: '919876543210',
          id: 'wamid.test123',
          timestamp: '1234567890',
          type: 'interactive',
          interactive: {
            type: 'button_reply',
            button_reply: {
              id: 'action1',
              title: 'View Leads'
            }
          }
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'message-id' },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      whatsappWebhookService.findOrCreateContact = jest.fn().mockResolvedValue({
        lead_id: 'lead-123'
      });

      whatsappSendService.logActivity = jest.fn().mockResolvedValue({ success: true });
      whatsappSendService.updateConversation = jest.fn().mockResolvedValue({ success: true });
      whatsappMetaService.markAsRead = jest.fn().mockResolvedValue({ success: true });
      whatsappAiService.isAutoReplyEnabled = jest.fn().mockResolvedValue(true);
      whatsappAiService.processIncomingMessage = jest.fn().mockRejectedValue(
        new Error('AI processing failed')
      );

      // Should not throw - errors are caught and logged
      const result = await whatsappWebhookService.handleIncomingMessages(
        mockCompanyId,
        messages,
        []
      );

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
    });
  });
});

