// Set up environment variables before imports
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

// Mock dependencies
jest.mock('../services/leadService');
jest.mock('../middleware/apiKeyMiddleware');
jest.mock('../utils/auditLogger');

const { captureLead, captureBulkLeads, getApiInfo } = require('../controllers/leadCaptureController');
const leadService = require('../services/leadService');
const { logApiRequest } = require('../middleware/apiKeyMiddleware');

describe('leadCaptureController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    req = {
      body: {},
      apiClient: {
        id: 'api-client-123',
        company_id: 'company-456',
        client_name: 'Test API Client',
        default_lead_source: 'api',
        default_assigned_to: null,
        rate_limit: 100,
        custom_field_mapping: {}
      }
    };

    // Mock response object
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Mock next function
    next = jest.fn();

    // Mock logApiRequest
    logApiRequest.mockResolvedValue(undefined);
  });

  describe('captureLead', () => {
    describe('✅ Success Cases', () => {
      it('should capture lead with basic required fields', async () => {
        req.body = {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        };

        const mockLead = {
          id: 'lead-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          status: 'new'
        };

        leadService.createLead.mockResolvedValue(mockLead);

        await captureLead(req, res, next);

        expect(leadService.createLead).toHaveBeenCalledWith({
          company_id: 'company-456',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: undefined,
          company: undefined,
          job_title: undefined,
          lead_source: 'api',
          status: 'new',
          notes: 'Lead captured via API from Test API Client',
          priority: 'medium',
          custom_fields: {},
          created_by: null,
          assigned_to: null
        });

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Lead captured successfully',
          data: {
            lead_id: 'lead-123',
            status: 'new'
          }
        });
      });

      it('should capture lead with custom fields', async () => {
        req.body = {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          custom_fields: {
            budget: '$50,000',
            timeline: 'Q1 2024',
            company_size: '50-100',
            interested_in: 'Enterprise Plan'
          }
        };

        const mockLead = {
          id: 'lead-456',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          status: 'new',
          custom_fields: req.body.custom_fields
        };

        leadService.createLead.mockResolvedValue(mockLead);

        await captureLead(req, res, next);

        expect(leadService.createLead).toHaveBeenCalledWith(
          expect.objectContaining({
            custom_fields: {
              budget: '$50,000',
              timeline: 'Q1 2024',
              company_size: '50-100',
              interested_in: 'Enterprise Plan'
            }
          })
        );

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Lead captured successfully',
          data: {
            lead_id: 'lead-456',
            status: 'new'
          }
        });
      });

      it('should apply custom field mapping when configured', async () => {
        req.apiClient.custom_field_mapping = {
          company_name: 'company',
          contact_phone: 'phone'
        };

        req.body = {
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob@example.com',
          custom_fields: {
            company_name: 'Acme Corp',
            contact_phone: '+1234567890',
            budget: '$100k'
          }
        };

        const mockLead = { id: 'lead-789' };
        leadService.createLead.mockResolvedValue(mockLead);

        await captureLead(req, res, next);

        // Should map company_name and contact_phone, keep budget unmapped
        expect(leadService.createLead).toHaveBeenCalledWith(
          expect.objectContaining({
            custom_fields: expect.objectContaining({
              company: 'Acme Corp',
              phone: '+1234567890',
              budget: '$100k'
            })
          })
        );
      });

      it('should accept phone as contact method instead of email', async () => {
        req.body = {
          first_name: 'Alice',
          last_name: 'Williams',
          phone: '+9876543210'
        };

        const mockLead = { id: 'lead-999' };
        leadService.createLead.mockResolvedValue(mockLead);

        await captureLead(req, res, next);

        expect(leadService.createLead).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+9876543210',
            email: undefined
          })
        );

        expect(res.json).toHaveBeenCalled();
      });

      it('should handle boolean custom fields', async () => {
        req.body = {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          custom_fields: {
            newsletter: true,
            urgent: false,
            demo_requested: true
          }
        };

        const mockLead = { id: 'lead-bool' };
        leadService.createLead.mockResolvedValue(mockLead);

        await captureLead(req, res, next);

        expect(leadService.createLead).toHaveBeenCalledWith(
          expect.objectContaining({
            custom_fields: {
              newsletter: true,
              urgent: false,
              demo_requested: true
            }
          })
        );
      });

      it('should handle numeric custom fields', async () => {
        req.body = {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          custom_fields: {
            employee_count: 150,
            budget_amount: 50000,
            score: 95.5
          }
        };

        const mockLead = { id: 'lead-num' };
        leadService.createLead.mockResolvedValue(mockLead);

        await captureLead(req, res, next);

        expect(leadService.createLead).toHaveBeenCalledWith(
          expect.objectContaining({
            custom_fields: {
              employee_count: 150,
              budget_amount: 50000,
              score: 95.5
            }
          })
        );
      });

      it('should log successful API request', async () => {
        req.body = {
          first_name: 'Log',
          last_name: 'Test',
          email: 'log@test.com'
        };

        const mockLead = { id: 'lead-log' };
        leadService.createLead.mockResolvedValue(mockLead);

        await captureLead(req, res, next);

        expect(logApiRequest).toHaveBeenCalledWith(
          'api-client-123',
          req,
          201,
          expect.any(Number),
          'lead-log'
        );
      });
    });

    describe('❌ Error Cases', () => {
      it('should reject lead without first_name', async () => {
        req.body = {
          last_name: 'Doe',
          email: 'test@example.com'
        };

        await captureLead(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'First name and last name are required',
            statusCode: 400
          })
        );
      });

      it('should reject lead without last_name', async () => {
        req.body = {
          first_name: 'John',
          email: 'test@example.com'
        };

        await captureLead(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'First name and last name are required',
            statusCode: 400
          })
        );
      });

      it('should reject lead without email or phone', async () => {
        req.body = {
          first_name: 'John',
          last_name: 'Doe'
        };

        await captureLead(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'At least one contact method (email or phone) is required',
            statusCode: 400
          })
        );
      });

      it('should handle database errors gracefully', async () => {
        req.body = {
          first_name: 'Error',
          last_name: 'Test',
          email: 'error@test.com'
        };

        const dbError = new Error('Database connection failed');
        leadService.createLead.mockRejectedValue(dbError);

        await captureLead(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
      });

      it('should log failed API request', async () => {
        req.body = {
          first_name: 'Fail',
          last_name: 'Test'
        };

        await captureLead(req, res, next);

        expect(logApiRequest).toHaveBeenCalledWith(
          'api-client-123',
          req,
          400,
          expect.any(Number),
          null,
          'At least one contact method (email or phone) is required'
        );
      });
    });
  });

  describe('captureBulkLeads', () => {
    describe('✅ Success Cases', () => {
      it('should capture multiple leads successfully', async () => {
        req.body = {
          leads: [
            {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com'
            },
            {
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane@example.com'
            }
          ]
        };

        leadService.createLead
          .mockResolvedValueOnce({ id: 'lead-1', email: 'john@example.com', first_name: 'John', last_name: 'Doe' })
          .mockResolvedValueOnce({ id: 'lead-2', email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' });

        await captureBulkLeads(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Bulk capture completed. 2 successful, 0 failed.',
          data: {
            successful: [
              { lead_id: 'lead-1', email: 'john@example.com', first_name: 'John', last_name: 'Doe' },
              { lead_id: 'lead-2', email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' }
            ],
            failed: []
          }
        });
      });

      it('should handle partial failures in bulk capture', async () => {
        req.body = {
          leads: [
            {
              first_name: 'Valid',
              last_name: 'Lead',
              email: 'valid@example.com'
            },
            {
              // Missing last_name
              first_name: 'Invalid',
              email: 'invalid@example.com'
            }
          ]
        };

        leadService.createLead.mockResolvedValueOnce({ 
          id: 'lead-valid', 
          email: 'valid@example.com',
          first_name: 'Valid',
          last_name: 'Lead'
        });

        await captureBulkLeads(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Bulk capture completed. 1 successful, 1 failed.',
          data: {
            successful: [
              { lead_id: 'lead-valid', email: 'valid@example.com', first_name: 'Valid', last_name: 'Lead' }
            ],
            failed: [
              {
                email: 'invalid@example.com',
                first_name: 'Invalid',
                last_name: undefined,
                error: 'First name and last name are required'
              }
            ]
          }
        });
      });

      it('should bulk capture leads with custom fields', async () => {
        req.body = {
          leads: [
            {
              first_name: 'Custom',
              last_name: 'Fields',
              email: 'custom@example.com',
              custom_fields: {
                budget: '$25k',
                timeline: 'Q2'
              }
            }
          ]
        };

        leadService.createLead.mockResolvedValue({ 
          id: 'lead-custom', 
          email: 'custom@example.com',
          first_name: 'Custom',
          last_name: 'Fields'
        });

        await captureBulkLeads(req, res, next);

        expect(leadService.createLead).toHaveBeenCalledWith(
          expect.objectContaining({
            custom_fields: {
              budget: '$25k',
              timeline: 'Q2'
            }
          })
        );
      });
    });

    describe('❌ Error Cases', () => {
      it('should reject bulk request without leads array', async () => {
        req.body = {};

        await captureBulkLeads(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Leads array is required and must not be empty',
            statusCode: 400
          })
        );
      });

      it('should reject bulk request with empty leads array', async () => {
        req.body = {
          leads: []
        };

        await captureBulkLeads(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Leads array is required and must not be empty',
            statusCode: 400
          })
        );
      });

      it('should reject bulk request with more than 100 leads', async () => {
        req.body = {
          leads: Array(101).fill({
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com'
          })
        };

        await captureBulkLeads(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Maximum 100 leads can be submitted at once',
            statusCode: 400
          })
        );
      });
    });
  });

  describe('getApiInfo', () => {
    it('should return API client information', async () => {
      req.apiClient = {
        client_name: 'My API Client',
        rate_limit: 200,
        default_lead_source: 'website',
        custom_field_mapping: {
          company_name: 'company'
        },
        allowed_origins: ['https://example.com']
      };

      await getApiInfo(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          client_name: 'My API Client',
          rate_limit: 200,
          default_lead_source: 'website',
          has_custom_field_mapping: true,
          allowed_origins: ['https://example.com']
        }
      });
    });

    it('should indicate no custom field mapping when empty', async () => {
      req.apiClient = {
        client_name: 'Simple Client',
        rate_limit: 100,
        default_lead_source: 'api',
        custom_field_mapping: {},
        allowed_origins: []
      };

      await getApiInfo(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            has_custom_field_mapping: false
          })
        })
      );
    });
  });

  describe('Custom Field Mapping Logic', () => {
    it('should map multiple custom fields correctly', async () => {
      req.apiClient.custom_field_mapping = {
        company_name: 'company',
        contact_phone: 'phone',
        budget_range: 'budget'
      };

      req.body = {
        first_name: 'Map',
        last_name: 'Test',
        email: 'map@test.com',
        custom_fields: {
          company_name: 'Test Corp',
          contact_phone: '555-1234',
          budget_range: '$50k-$100k',
          unmapped_field: 'Keep this'
        }
      };

      leadService.createLead.mockResolvedValue({ id: 'lead-mapped' });

      await captureLead(req, res, next);

      expect(leadService.createLead).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_fields: {
            company: 'Test Corp',
            phone: '555-1234',
            budget: '$50k-$100k',
            unmapped_field: 'Keep this'
          }
        })
      );
    });

    it('should preserve unmapped fields', async () => {
      req.apiClient.custom_field_mapping = {
        old_name: 'new_name'
      };

      req.body = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        custom_fields: {
          old_name: 'value1',
          keep_field: 'value2',
          another_field: 'value3'
        }
      };

      leadService.createLead.mockResolvedValue({ id: 'lead-preserve' });

      await captureLead(req, res, next);

      expect(leadService.createLead).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_fields: {
            new_name: 'value1',
            keep_field: 'value2',
            another_field: 'value3'
          }
        })
      );
    });
  });
});

