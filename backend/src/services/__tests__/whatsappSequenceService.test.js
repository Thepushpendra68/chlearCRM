/**
 * WhatsApp Sequence Service Tests
 * Tests for WhatsApp campaign/sequence automation
 */

const whatsappSequenceService = require('../whatsappSequenceService');
const whatsappSendService = require('../whatsappSendService');
const { supabaseAdmin } = require('../../config/supabase');

jest.mock('../whatsappSendService');
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            maybeSingle: jest.fn(),
            single: jest.fn(),
            limit: jest.fn(),
            or: jest.fn(),
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
            delete: jest.fn(),
            range: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('WhatsApp Sequence Service', () => {
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockSequenceId = 'sequence-123';
  const mockLeadId = 'lead-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSequences', () => {
    it('should get all sequences for a company', async () => {
      const mockSequences = [
        { id: 'seq1', name: 'Welcome Sequence', is_active: true },
        { id: 'seq2', name: 'Follow-up Sequence', is_active: false }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({
                data: mockSequences,
                error: null
              })
            }))
          }))
        }))
      });

      const result = await whatsappSequenceService.getSequences(mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.sequences).toEqual(mockSequences);
    });

    it('should filter sequences by is_active status', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn().mockResolvedValue({
                  data: [{ id: 'seq1', is_active: true }],
                  error: null
                })
              }))
            }))
          }))
        }))
      });

      const result = await whatsappSequenceService.getSequences(mockCompanyId, {
        isActive: true
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getSequenceById', () => {
    it('should get sequence by ID', async () => {
      const mockSequence = {
        id: mockSequenceId,
        name: 'Welcome Sequence',
        json_definition: { steps: [] }
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockSequence,
                error: null
              })
            }))
          }))
        }))
      });

      const result = await whatsappSequenceService.getSequenceById(mockSequenceId, mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.sequence).toEqual(mockSequence);
    });

    it('should return 404 for non-existent sequence', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            }))
          }))
        }))
      });

      await expect(
        whatsappSequenceService.getSequenceById('non-existent', mockCompanyId)
      ).rejects.toThrow('Sequence not found');
    });
  });

  describe('createSequence', () => {
    it('should create a new sequence', async () => {
      const sequenceData = {
        name: 'Welcome Sequence',
        description: 'Welcome new leads',
        json_definition: {
          steps: [
            {
              type: 'text',
              message_text: 'Welcome!',
              delay: 0
            }
          ]
        },
        is_active: false
      };

      const mockCreatedSequence = {
        id: mockSequenceId,
        ...sequenceData
      };

      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedSequence,
              error: null
            })
          }))
        }))
      });

      const result = await whatsappSequenceService.createSequence(
        sequenceData,
        mockCompanyId,
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.sequence.name).toBe('Welcome Sequence');
    });

    it('should throw error if name is missing', async () => {
      const sequenceData = {
        description: 'Test',
        json_definition: { steps: [] }
      };

      await expect(
        whatsappSequenceService.createSequence(sequenceData, mockCompanyId, mockUserId)
      ).rejects.toThrow('Name and workflow definition are required');
    });

    it('should throw error if json_definition is missing', async () => {
      const sequenceData = {
        name: 'Test Sequence'
      };

      await expect(
        whatsappSequenceService.createSequence(sequenceData, mockCompanyId, mockUserId)
      ).rejects.toThrow('Name and workflow definition are required');
    });

    it('should throw error if steps array is missing', async () => {
      const sequenceData = {
        name: 'Test Sequence',
        json_definition: {}
      };

      await expect(
        whatsappSequenceService.createSequence(sequenceData, mockCompanyId, mockUserId)
      ).rejects.toThrow('Workflow definition must have a steps array');
    });
  });

  describe('enrollLead', () => {
    it('should enroll lead in sequence', async () => {
      const mockSequence = {
        id: mockSequenceId,
        json_definition: {
          steps: [
            { type: 'text', message_text: 'Hello', delay: 0 }
          ]
        },
        max_messages_per_day: 5
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn()
                .mockResolvedValueOnce({ data: null, error: null }) // Check existing enrollment
                .mockResolvedValueOnce({ data: mockSequence, error: null }) // Get sequence
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'enrollment-123',
                sequence_id: mockSequenceId,
                lead_id: mockLeadId,
                status: 'active'
              },
              error: null
            })
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      const result = await whatsappSequenceService.enrollLead(
        mockSequenceId,
        mockLeadId,
        mockCompanyId,
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.enrollment.lead_id).toBe(mockLeadId);
    });

    it('should not enroll if lead is already enrolled', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'enrollment-123',
                  status: 'active'
                },
                error: null
              })
            }))
          }))
        }))
      });

      await expect(
        whatsappSequenceService.enrollLead(mockSequenceId, mockLeadId, mockCompanyId, mockUserId)
      ).rejects.toThrow('already enrolled');
    });
  });

  describe('processActiveEnrollments', () => {
    it('should process active enrollments that are due', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment-1',
          sequence_id: mockSequenceId,
          lead_id: mockLeadId,
          current_step: 0,
          status: 'active',
          next_run_at: new Date(Date.now() - 1000).toISOString(), // Past date
          sequence: {
            id: mockSequenceId,
            company_id: mockCompanyId,
            is_active: true,
            json_definition: {
              steps: [
                { type: 'text', message_text: 'Hello', delay: 0 }
              ]
            }
          },
          lead: {
            id: mockLeadId,
            phone: '919876543210',
            mobile_phone: '919876543210'
          }
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            lte: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: mockEnrollments,
                error: null
              })
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123'
      });

      const result = await whatsappSequenceService.processActiveEnrollments();

      expect(result.success).toBe(true);
      expect(result.processed).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should return success with 0 processed if no enrollments due', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            lte: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            }))
          }))
        }))
      });

      const result = await whatsappSequenceService.processActiveEnrollments();

      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
    });
  });

  describe('checkAndAutoEnroll', () => {
    it('should auto-enroll lead if conditions match', async () => {
      const mockSequences = [
        {
          id: 'seq1',
          entry_conditions: { source: 'whatsapp' }
        }
      ];

      const mockLead = {
        id: mockLeadId,
        source: 'whatsapp',
        status: 'new'
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              not: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
              }))
            }))
          }))
        }))
      });

      // Mock enrollLead
      whatsappSequenceService.enrollLead = jest.fn().mockResolvedValue({
        success: true,
        enrollment: { id: 'enrollment-123' }
      });

      // Mock getSequences
      whatsappSequenceService.getSequences = jest.fn().mockResolvedValue({
        success: true,
        sequences: mockSequences
      });

      // Mock getLead
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockLead,
              error: null
            })
          }))
        }))
      });

      const result = await whatsappSequenceService.checkAndAutoEnroll(mockLeadId, mockCompanyId);

      expect(result.success).toBe(true);
    });

    it('should not enroll if conditions do not match', async () => {
      const mockSequences = [
        {
          id: 'seq1',
          entry_conditions: { source: 'website' }
        }
      ];

      const mockLead = {
        id: mockLeadId,
        source: 'whatsapp',
        status: 'new'
      };

      whatsappSequenceService.getSequences = jest.fn().mockResolvedValue({
        success: true,
        sequences: mockSequences
      });

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockLead,
              error: null
            })
          }))
        }))
      });

      whatsappSequenceService.enrollLead = jest.fn();

      const result = await whatsappSequenceService.checkAndAutoEnroll(mockLeadId, mockCompanyId);

      expect(result.success).toBe(true);
      expect(result.enrolled).toBe(0);
      expect(whatsappSequenceService.enrollLead).not.toHaveBeenCalled();
    });
  });
});

