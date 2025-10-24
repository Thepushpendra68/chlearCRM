process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

jest.mock('../config/industry/configLoader', () => ({
  getConfigForCompany: jest.fn(() => ({
    industryType: 'generic',
    customFields: {},
    validation: {}
  })),
  validateCustomFields: jest.fn(() => ({
    valid: true,
    errors: []
  }))
}));

const ApiError = require('../utils/ApiError');
const { supabaseAdmin } = require('../config/supabase');
const leadService = require('../services/leadService');

describe('leadService', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createLead', () => {
    it('normalizes email before inserting', async () => {
      const insertPayloads = [];
      const singleMock = jest.fn().mockResolvedValue({
        data: {
          id: 'lead-123',
          email: 'test@example.com',
          company_id: 'company-1'
        },
        error: null
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn((payload) => {
        insertPayloads.push(payload);
        return { select: selectMock };
      });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'companies') {
          const singleMockCompany = jest.fn().mockResolvedValue({
            data: {
              id: 'company-1',
              industry_type: 'generic'
            },
            error: null
          });
          const eqMock = jest.fn().mockReturnValue({ single: singleMockCompany });
          const selectMockCompany = jest.fn().mockReturnValue({ eq: eqMock });
          return { select: selectMockCompany };
        }

        if (table === 'leads') {
          return { insert: insertMock };
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      const leadData = {
        company_id: 'company-1',
        first_name: 'Test',
        last_name: 'User',
        email: 'Test@Example.com ',
        phone: null,
        job_title: null,
        lead_source: 'website',
        status: 'new',
        priority: 'medium',
        assigned_to: null,
        pipeline_stage_id: 'stage-123',
        created_by: 'user-1'
      };

      const result = await leadService.createLead(leadData);

      expect(result).toEqual({
        id: 'lead-123',
        email: 'test@example.com',
        company_id: 'company-1'
      });
      expect(insertMock).toHaveBeenCalledTimes(1);
      expect(insertPayloads[0].email).toBe('test@example.com');
    });

    it('throws ApiError when Supabase reports unique constraint violation', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint'
        }
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'companies') {
          const singleMockCompany = jest.fn().mockResolvedValue({
            data: {
              id: 'company-1',
              industry_type: 'generic'
            },
            error: null
          });
          const eqMock = jest.fn().mockReturnValue({ single: singleMockCompany });
          const selectMockCompany = jest.fn().mockReturnValue({ eq: eqMock });
          return { select: selectMockCompany };
        }

        if (table === 'leads') {
          return { insert: insertMock };
        }

        throw new Error(`Unexpected table: ${table}`);
      });

      const leadData = {
        company_id: 'company-1',
        first_name: 'Test',
        last_name: 'User',
        email: 'duplicate@example.com',
        phone: null,
        job_title: null,
        lead_source: 'website',
        status: 'new',
        priority: 'medium',
        assigned_to: null,
        pipeline_stage_id: 'stage-123',
        created_by: 'user-1'
      };

      const promise = leadService.createLead(leadData);

      await expect(promise).rejects.toBeInstanceOf(ApiError);
      await expect(promise).rejects.toMatchObject({
        message: 'Email already exists',
        statusCode: 400
      });
    });
  });

  describe('updateLead', () => {
    it('normalizes email when updating a lead', async () => {
      const existingLead = {
        id: 'lead-123',
        assigned_to: 'user-1',
        company_id: 'company-1'
      };

      const fetchSingleMock = jest.fn().mockResolvedValue({
        data: existingLead,
        error: null
      });
      const fetchEqMock = jest.fn(() => ({
        single: fetchSingleMock
      }));
      const fetchSelectMock = jest.fn(() => ({
        eq: fetchEqMock
      }));

      const updateCalls = [];
      const updateSingleMock = jest.fn().mockResolvedValue({
        data: {
          ...existingLead,
          email: 'updated@example.com'
        },
        error: null
      });
      const updateSelectMock = jest.fn(() => ({
        single: updateSingleMock
      }));
      const updateEqMock = jest.fn(() => ({
        select: updateSelectMock
      }));
      const updateMock = jest.fn((payload) => {
        updateCalls.push(payload);
        return {
          eq: updateEqMock
        };
      });

      supabaseAdmin.from
        .mockImplementationOnce(() => ({
          select: fetchSelectMock
        }))
        .mockImplementationOnce(() => {
          const singleMockCompany = jest.fn().mockResolvedValue({
            data: {
              id: 'company-1',
              industry_type: 'generic'
            },
            error: null
          });
          const eqMock = jest.fn().mockReturnValue({ single: singleMockCompany });
          const selectMockCompany = jest.fn().mockReturnValue({ eq: eqMock });
          return { select: selectMockCompany };
        })
        .mockImplementationOnce(() => ({
          update: updateMock
        }));

      const result = await leadService.updateLead(
        'lead-123',
        { email: 'Updated@Example.com ' },
        { id: 'admin-1', role: 'company_admin' }
      );

      expect(fetchSelectMock).toHaveBeenCalledWith('*');
      expect(fetchEqMock).toHaveBeenCalledWith('id', 'lead-123');
      expect(updateCalls[0].email).toBe('updated@example.com');
      expect(updateEqMock).toHaveBeenCalledWith('id', 'lead-123');
      expect(result.updatedLead.email).toBe('updated@example.com');
    });
  });
});
