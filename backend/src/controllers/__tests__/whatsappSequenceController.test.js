/**
 * WhatsApp Sequence Controller Tests
 * Tests for WhatsApp sequence/campaign API endpoints
 */

const request = require('supertest');
const app = require('../../app');
const whatsappSequenceService = require('../../services/whatsappSequenceService');

jest.mock('../../services/whatsappSequenceService');
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'user-123', company_id: 'company-123', role: 'manager' };
    next();
  },
  requireRole: () => (req, res, next) => next()
}));

describe('WhatsApp Sequence Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/whatsapp/sequences', () => {
    it('should get all sequences', async () => {
      const mockSequences = [
        { id: 'seq1', name: 'Welcome Sequence', is_active: true },
        { id: 'seq2', name: 'Follow-up Sequence', is_active: false }
      ];

      whatsappSequenceService.getSequences.mockResolvedValue({
        success: true,
        sequences: mockSequences
      });

      const response = await request(app)
        .get('/api/whatsapp/sequences')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSequences);
      expect(whatsappSequenceService.getSequences).toHaveBeenCalledWith(
        'company-123',
        {}
      );
    });

    it('should filter sequences by is_active', async () => {
      whatsappSequenceService.getSequences.mockResolvedValue({
        success: true,
        sequences: [{ id: 'seq1', is_active: true }]
      });

      await request(app)
        .get('/api/whatsapp/sequences')
        .query({ is_active: 'true' })
        .expect(200);

      expect(whatsappSequenceService.getSequences).toHaveBeenCalledWith(
        'company-123',
        { isActive: true }
      );
    });
  });

  describe('GET /api/whatsapp/sequences/:id', () => {
    it('should get sequence by ID', async () => {
      const mockSequence = {
        id: 'seq-123',
        name: 'Welcome Sequence',
        json_definition: { steps: [] }
      };

      whatsappSequenceService.getSequenceById.mockResolvedValue({
        success: true,
        sequence: mockSequence
      });

      const response = await request(app)
        .get('/api/whatsapp/sequences/seq-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSequence);
      expect(whatsappSequenceService.getSequenceById).toHaveBeenCalledWith(
        'seq-123',
        'company-123'
      );
    });

    it('should return 404 for non-existent sequence', async () => {
      whatsappSequenceService.getSequenceById.mockRejectedValue(
        new Error('Sequence not found')
      );

      await request(app)
        .get('/api/whatsapp/sequences/non-existent')
        .expect(500);
    });
  });

  describe('POST /api/whatsapp/sequences', () => {
    it('should create a new sequence', async () => {
      const sequenceData = {
        name: 'Welcome Sequence',
        description: 'Welcome new leads',
        json_definition: {
          steps: [
            { type: 'text', message_text: 'Hello', delay: 0 }
          ]
        },
        is_active: false
      };

      const mockCreatedSequence = {
        id: 'seq-123',
        ...sequenceData
      };

      whatsappSequenceService.createSequence.mockResolvedValue({
        success: true,
        sequence: mockCreatedSequence
      });

      const response = await request(app)
        .post('/api/whatsapp/sequences')
        .send(sequenceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Welcome Sequence');
      expect(whatsappSequenceService.createSequence).toHaveBeenCalledWith(
        sequenceData,
        'company-123',
        'user-123'
      );
    });

    it('should return 400 for invalid sequence data', async () => {
      whatsappSequenceService.createSequence.mockRejectedValue(
        new Error('Name and workflow definition are required')
      );

      await request(app)
        .post('/api/whatsapp/sequences')
        .send({ name: 'Test' })
        .expect(500);
    });
  });

  describe('PUT /api/whatsapp/sequences/:id', () => {
    it('should update sequence', async () => {
      const updateData = {
        name: 'Updated Sequence',
        is_active: true
      };

      const mockUpdatedSequence = {
        id: 'seq-123',
        ...updateData
      };

      whatsappSequenceService.updateSequence.mockResolvedValue({
        success: true,
        sequence: mockUpdatedSequence
      });

      const response = await request(app)
        .put('/api/whatsapp/sequences/seq-123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Sequence');
      expect(whatsappSequenceService.updateSequence).toHaveBeenCalledWith(
        'seq-123',
        updateData,
        'company-123'
      );
    });
  });

  describe('DELETE /api/whatsapp/sequences/:id', () => {
    it('should delete sequence', async () => {
      whatsappSequenceService.deleteSequence.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .delete('/api/whatsapp/sequences/seq-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(whatsappSequenceService.deleteSequence).toHaveBeenCalledWith(
        'seq-123',
        'company-123'
      );
    });
  });

  describe('POST /api/whatsapp/sequences/:id/enroll', () => {
    it('should enroll lead in sequence', async () => {
      const mockEnrollment = {
        id: 'enrollment-123',
        sequence_id: 'seq-123',
        lead_id: 'lead-123',
        status: 'active'
      };

      whatsappSequenceService.enrollLead.mockResolvedValue({
        success: true,
        enrollment: mockEnrollment
      });

      const response = await request(app)
        .post('/api/whatsapp/sequences/seq-123/enroll')
        .send({ lead_id: 'lead-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockEnrollment);
      expect(whatsappSequenceService.enrollLead).toHaveBeenCalledWith(
        'seq-123',
        'lead-123',
        'company-123',
        'user-123'
      );
    });

    it('should return 400 if lead_id is missing', async () => {
      await request(app)
        .post('/api/whatsapp/sequences/seq-123/enroll')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/whatsapp/sequences/:id/unenroll', () => {
    it('should unenroll lead from sequence', async () => {
      whatsappSequenceService.unenrollLead.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .post('/api/whatsapp/sequences/seq-123/unenroll')
        .send({ lead_id: 'lead-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(whatsappSequenceService.unenrollLead).toHaveBeenCalledWith(
        'seq-123',
        'lead-123'
      );
    });
  });

  describe('GET /api/whatsapp/sequences/:id/enrollments', () => {
    it('should get enrollments for a sequence', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          lead_id: 'lead-123',
          status: 'active',
          lead: { id: 'lead-123', first_name: 'John', last_name: 'Doe' }
        }
      ];

      // Mock Supabase query
      const { supabaseAdmin } = require('../../config/supabase');
      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: mockEnrollments,
                error: null
              })
            }))
          }))
        }))
      }));

      const { supabaseAdmin } = require('../../config/supabase');
      supabaseAdmin.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: mockEnrollments,
                error: null
              })
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/whatsapp/sequences/seq-123/enrollments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

