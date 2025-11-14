/**
 * WhatsApp Broadcast Service Tests
 * Tests for broadcast/bulk messaging functionality
 */

const whatsappBroadcastService = require('../whatsappBroadcastService');
const whatsappSendService = require('../whatsappSendService');
const leadService = require('../leadService');
const { supabaseAdmin } = require('../../config/supabase');
const ApiError = require('../../utils/ApiError');

jest.mock('../whatsappSendService');
jest.mock('../leadService');
jest.mock('../../config/supabase', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          not: jest.fn(() => ({
            neq: jest.fn(() => ({
              in: jest.fn(() => ({
                or: jest.fn(() => ({
                  gte: jest.fn(() => ({
                    lte: jest.fn(() => ({
                      order: jest.fn(() => ({
                        range: jest.fn(),
                        maybeSingle: jest.fn(),
                        single: jest.fn()
                      }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        delete: jest.fn()
      }))
    }))
  };
  return {
    supabaseAdmin: mockSupabase
  };
});

describe('WhatsApp Broadcast Service', () => {
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockBroadcastId = 'broadcast-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBroadcast', () => {
    it('should create a broadcast successfully', async () => {
      const broadcastData = {
        name: 'Test Broadcast',
        description: 'Test description',
        message_type: 'text',
        content: 'Hello World',
        recipient_type: 'leads',
        messages_per_minute: 10,
        batch_size: 10
      };

      // Mock recipient resolution
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              neq: jest.fn().mockResolvedValue({
                data: [
                  { id: 'lead-1', phone: '919876543210', name: 'Lead 1' },
                  { id: 'lead-2', phone: '919876543211', name: 'Lead 2' }
                ],
                error: null
              })
            }))
          }))
        }))
      });

      // Mock broadcast insert
      supabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockBroadcastId,
                ...broadcastData,
                recipient_count: 2
              },
              error: null
            })
          }))
        }))
      });

      // Mock recipient records insert
      supabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null
        })
      });

      const result = await whatsappBroadcastService.createBroadcast(mockCompanyId, broadcastData);

      expect(result.success).toBe(true);
      expect(result.broadcast.id).toBe(mockBroadcastId);
      expect(result.broadcast.recipient_count).toBe(2);
    });

    it('should throw error if name is missing', async () => {
      const broadcastData = {
        message_type: 'text',
        content: 'Hello'
      };

      await expect(
        whatsappBroadcastService.createBroadcast(mockCompanyId, broadcastData)
      ).rejects.toThrow('Name and message type are required');
    });

    it('should throw error if no recipients found', async () => {
      const broadcastData = {
        name: 'Test',
        message_type: 'text',
        content: 'Hello',
        recipient_type: 'leads'
      };

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              neq: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            }))
          }))
        }))
      });

      await expect(
        whatsappBroadcastService.createBroadcast(mockCompanyId, broadcastData)
      ).rejects.toThrow('No recipients found');
    });
  });

  describe('resolveRecipients', () => {
    it('should resolve leads recipients', async () => {
      const mockLeads = [
        { id: 'lead-1', phone: '919876543210', name: 'Lead 1' },
        { id: 'lead-2', phone: '919876543211', name: 'Lead 2' }
      ];

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              neq: jest.fn().mockResolvedValue({
                data: mockLeads,
                error: null
              })
            }))
          }))
        }))
      });

      const recipients = await whatsappBroadcastService.resolveRecipients(
        mockCompanyId,
        'leads',
        null,
        null
      );

      expect(recipients).toHaveLength(2);
      expect(recipients[0].whatsapp_id).toBe('919876543210');
      expect(recipients[0].lead_id).toBe('lead-1');
    });

    it('should resolve filtered recipients', async () => {
      const filters = {
        status: 'new',
        source: 'website'
      };

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              not: jest.fn(() => ({
                neq: jest.fn().mockResolvedValue({
                  data: [
                    { id: 'lead-1', phone: '919876543210', name: 'Lead 1' }
                  ],
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      const recipients = await whatsappBroadcastService.resolveRecipients(
        mockCompanyId,
        'filter',
        null,
        filters
      );

      expect(recipients).toHaveLength(1);
    });

    it('should remove duplicate phone numbers', async () => {
      const mockLeads = [
        { id: 'lead-1', phone: '919876543210', name: 'Lead 1' },
        { id: 'lead-2', phone: '919876543210', name: 'Lead 2' } // Duplicate
      ];

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              neq: jest.fn().mockResolvedValue({
                data: mockLeads,
                error: null
              })
            }))
          }))
        }))
      });

      const recipients = await whatsappBroadcastService.resolveRecipients(
        mockCompanyId,
        'leads',
        null,
        null
      );

      expect(recipients).toHaveLength(1); // Duplicate removed
    });
  });

  describe('sendBroadcast', () => {
    it('should send broadcast to all recipients', async () => {
      const mockBroadcast = {
        id: mockBroadcastId,
        company_id: mockCompanyId,
        message_type: 'text',
        content: 'Hello',
        batch_size: 2,
        messages_per_minute: 10,
        created_by: mockUserId
      };

      const mockRecipients = [
        {
          id: 'recipient-1',
          whatsapp_id: '919876543210',
          lead_id: 'lead-1',
          status: 'pending'
        },
        {
          id: 'recipient-2',
          whatsapp_id: '919876543211',
          lead_id: 'lead-2',
          status: 'pending'
        }
      ];

      // Mock get broadcast
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockBroadcast,
              error: null
            })
          }))
        }))
      });

      // Mock update broadcast status
      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      // Mock get recipients
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: mockRecipients,
                error: null
              })
            }))
          }))
        }))
      });

      // Mock send service
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123',
        message: { id: 'msg-1' }
      });

      // Mock update recipient status
      supabaseAdmin.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      // Mock update progress
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { progress: { sent: 0, delivered: 0, read: 0, failed: 0 } },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      // Mock final status update
      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      const result = await whatsappBroadcastService.sendBroadcast(mockBroadcastId);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(whatsappSendService.sendTextMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle send errors gracefully', async () => {
      const mockBroadcast = {
        id: mockBroadcastId,
        company_id: mockCompanyId,
        message_type: 'text',
        content: 'Hello',
        batch_size: 1,
        messages_per_minute: 10,
        created_by: mockUserId
      };

      const mockRecipients = [
        {
          id: 'recipient-1',
          whatsapp_id: '919876543210',
          lead_id: 'lead-1',
          status: 'pending'
        }
      ];

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockBroadcast,
              error: null
            })
          }))
        }))
      });

      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: mockRecipients,
                error: null
              })
            }))
          }))
        }))
      });

      // Mock send failure
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: false,
        error: new ApiError('Send failed', 500)
      });

      supabaseAdmin.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { progress: { sent: 0, delivered: 0, read: 0, failed: 0 } },
              error: null
            })
          }))
        }))
      });

      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      const result = await whatsappBroadcastService.sendBroadcast(mockBroadcastId);

      expect(result.success).toBe(true);
      expect(result.failed).toBe(1);
      expect(result.sent).toBe(0);
    });
  });

  describe('getBroadcasts', () => {
    it('should get all broadcasts for a company', async () => {
      const mockBroadcasts = [
        { id: 'broadcast-1', name: 'Broadcast 1', status: 'sent' },
        { id: 'broadcast-2', name: 'Broadcast 2', status: 'draft' }
      ];

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({
              data: mockBroadcasts,
              error: null
            })
          }))
        }))
      });

      const result = await whatsappBroadcastService.getBroadcasts(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.broadcasts).toEqual(mockBroadcasts);
    });

    it('should filter broadcasts by status', async () => {
      const mockBroadcasts = [
        { id: 'broadcast-1', name: 'Broadcast 1', status: 'sent' }
      ];

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: mockBroadcasts,
                error: null
              })
            }))
          }))
        }))
      });

      const result = await whatsappBroadcastService.getBroadcasts(mockCompanyId, {
        status: 'sent'
      });

      expect(result.success).toBe(true);
      expect(result.broadcasts).toHaveLength(1);
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should normalize phone numbers correctly', () => {
      const service = whatsappBroadcastService;
      expect(service.normalizePhoneNumber('+91 98765 43210')).toBe('919876543210');
      expect(service.normalizePhoneNumber('91-98765-43210')).toBe('919876543210');
      expect(service.normalizePhoneNumber('(91) 98765-43210')).toBe('919876543210');
    });

    it('should handle null/undefined', () => {
      const service = whatsappBroadcastService;
      expect(service.normalizePhoneNumber(null)).toBeNull();
      expect(service.normalizePhoneNumber(undefined)).toBeNull();
    });
  });
});

