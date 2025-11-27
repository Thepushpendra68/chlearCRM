/**
 * WhatsApp Broadcast Controller Tests
 * Tests for broadcast API endpoints
 */

const request = require('supertest');
const app = require('../../app');
const whatsappBroadcastService = require('../../services/whatsappBroadcastService');
const { supabaseAdmin } = require('../../config/supabase');

jest.mock('../../services/whatsappBroadcastService');
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}));

// Mock authentication middleware
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'user-123', company_id: 'company-123' };
    next();
  },
  requireRole: () => (req, res, next) => next()
}));

describe('WhatsApp Broadcast Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/whatsapp/broadcasts', () => {
    it('should create a broadcast successfully', async () => {
      const mockBroadcast = {
        id: 'broadcast-123',
        name: 'Test Broadcast',
        message_type: 'text',
        content: 'Hello World',
        recipient_count: 10
      };

      whatsappBroadcastService.createBroadcast.mockResolvedValue({
        success: true,
        broadcast: mockBroadcast
      });

      const response = await request(app)
        .post('/api/whatsapp/broadcasts')
        .send({
          name: 'Test Broadcast',
          message_type: 'text',
          content: 'Hello World',
          recipient_type: 'leads'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('broadcast-123');
      expect(whatsappBroadcastService.createBroadcast).toHaveBeenCalledWith(
        'company-123',
        expect.objectContaining({
          name: 'Test Broadcast',
          created_by: 'user-123'
        })
      );
    });

    it('should return 400 for invalid data', async () => {
      whatsappBroadcastService.createBroadcast.mockRejectedValue(
        new Error('Name and message type are required')
      );

      const response = await request(app)
        .post('/api/whatsapp/broadcasts')
        .send({
          message_type: 'text'
          // Missing name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/whatsapp/broadcasts', () => {
    it('should get all broadcasts', async () => {
      const mockBroadcasts = [
        { id: 'broadcast-1', name: 'Broadcast 1' },
        { id: 'broadcast-2', name: 'Broadcast 2' }
      ];

      whatsappBroadcastService.getBroadcasts.mockResolvedValue({
        success: true,
        broadcasts: mockBroadcasts
      });

      const response = await request(app)
        .get('/api/whatsapp/broadcasts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBroadcasts);
      expect(whatsappBroadcastService.getBroadcasts).toHaveBeenCalledWith(
        'company-123',
        {}
      );
    });

    it('should filter broadcasts by status', async () => {
      whatsappBroadcastService.getBroadcasts.mockResolvedValue({
        success: true,
        broadcasts: []
      });

      await request(app)
        .get('/api/whatsapp/broadcasts?status=sent')
        .expect(200);

      expect(whatsappBroadcastService.getBroadcasts).toHaveBeenCalledWith(
        'company-123',
        { status: 'sent' }
      );
    });
  });

  describe('GET /api/whatsapp/broadcasts/:id', () => {
    it('should get broadcast by ID', async () => {
      const mockBroadcast = {
        id: 'broadcast-123',
        name: 'Test Broadcast',
        recipients: []
      };

      whatsappBroadcastService.getBroadcastById.mockResolvedValue({
        success: true,
        broadcast: mockBroadcast
      });

      const response = await request(app)
        .get('/api/whatsapp/broadcasts/broadcast-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('broadcast-123');
      expect(whatsappBroadcastService.getBroadcastById).toHaveBeenCalledWith(
        'broadcast-123',
        'company-123'
      );
    });
  });

  describe('POST /api/whatsapp/broadcasts/:id/send', () => {
    it('should send broadcast successfully', async () => {
      whatsappBroadcastService.sendBroadcast.mockResolvedValue({
        success: true,
        sent: 10,
        failed: 0,
        total: 10
      });

      const response = await request(app)
        .post('/api/whatsapp/broadcasts/broadcast-123/send')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sent).toBe(10);
      expect(whatsappBroadcastService.sendBroadcast).toHaveBeenCalledWith('broadcast-123');
    });
  });

  describe('POST /api/whatsapp/broadcasts/:id/cancel', () => {
    it('should cancel broadcast successfully', async () => {
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'broadcast-123', status: 'scheduled' },
                error: null
              })
            }))
          }))
        }))
      });

      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      const response = await request(app)
        .post('/api/whatsapp/broadcasts/broadcast-123/cancel')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 if broadcast already sent', async () => {
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'broadcast-123', status: 'sent' },
                error: null
              })
            }))
          }))
        }))
      });

      const response = await request(app)
        .post('/api/whatsapp/broadcasts/broadcast-123/cancel')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/whatsapp/broadcasts/:id', () => {
    it('should delete broadcast successfully', async () => {
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'broadcast-123', status: 'draft' },
                error: null
              })
            }))
          }))
        }))
      });

      supabaseAdmin.from.mockReturnValueOnce({
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      const response = await request(app)
        .delete('/api/whatsapp/broadcasts/broadcast-123')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/whatsapp/broadcasts/:id/stats', () => {
    it('should get broadcast statistics', async () => {
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  progress: { sent: 5, delivered: 3, read: 2, failed: 0 },
                  recipient_count: 10
                },
                error: null
              })
            }))
          }))
        }))
      });

      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [
            { status: 'sent' },
            { status: 'sent' },
            { status: 'delivered' },
            { status: 'read' }
          ],
          error: null
        })
      });

      const response = await request(app)
        .get('/api/whatsapp/broadcasts/broadcast-123/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(10);
      expect(response.body.data.sent).toBe(2);
    });
  });
});

