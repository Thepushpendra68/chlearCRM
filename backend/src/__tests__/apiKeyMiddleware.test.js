// Set up environment variables before imports
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

const { supabaseAdmin } = require('../config/supabase');
const { validateApiKey, logApiRequest } = require('../middleware/apiKeyMiddleware');
const ApiError = require('../utils/ApiError');

describe('apiKeyMiddleware', () => {
  let req, res, next;
  let fromMock, selectMock, eqMock, singleMock, insertMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup request mock
    req = {
      headers: {},
      method: 'POST',
      originalUrl: '/api/v1/capture/lead',
      body: {},
      get: function(header) {
        return this.headers[header.toLowerCase()];
      }
    };

    // Setup response mock
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Setup next function
    next = jest.fn();

    // Setup Supabase mock chain
    singleMock = jest.fn();
    eqMock = jest.fn().mockReturnValue({ single: singleMock });
    selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    insertMock = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ error: null }) });
    fromMock = jest.fn().mockReturnValue({ 
      select: selectMock,
      insert: insertMock
    });
    
    supabaseAdmin.from = fromMock;
  });

  describe('validateApiKey', () => {
    describe('✅ Successful Authentication', () => {
      it('should authenticate with valid API key and secret', async () => {
        req.headers['x-api-key'] = 'ck_valid123';
        req.headers['x-api-secret'] = 'secret_valid456';

        const mockApiClient = {
          id: 'client-123',
          company_id: 'company-456',
          client_name: 'Test Client',
          api_key: 'ck_valid123',
          api_secret_hash: '$2a$10$hashedSecret',
          rate_limit: 100,
          default_lead_source: 'api',
          custom_field_mapping: {},
          is_active: true
        };

        singleMock.mockResolvedValue({
          data: mockApiClient,
          error: null
        });

        // Mock bcryptjs for password comparison
        const bcrypt = require('bcryptjs');
        bcrypt.compare = jest.fn().mockResolvedValue(true);

        await validateApiKey(req, res, next);

        expect(supabaseAdmin.from).toHaveBeenCalledWith('api_clients');
        expect(next).toHaveBeenCalledWith();
        expect(req.apiClient).toEqual(mockApiClient);
      });

      it('should attach api client data to request', async () => {
        req.headers['x-api-key'] = 'ck_test123';
        req.headers['x-api-secret'] = 'secret_test456';

        const mockApiClient = {
          id: 'client-789',
          company_id: 'company-999',
          client_name: 'Attach Test',
          custom_field_mapping: {
            company_name: 'company'
          },
          is_active: true
        };

        singleMock.mockResolvedValue({
          data: mockApiClient,
          error: null
        });

        const bcrypt = require('bcryptjs');
        bcrypt.compare = jest.fn().mockResolvedValue(true);

        await validateApiKey(req, res, next);

        expect(req.apiClient).toEqual(mockApiClient);
        expect(req.apiClient.custom_field_mapping).toEqual({
          company_name: 'company'
        });
      });
    });

    describe('❌ Authentication Failures', () => {
      it('should reject request without API key header', async () => {
        req.headers['x-api-secret'] = 'secret_test';

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'API key and secret are required',
            statusCode: 401
          })
        );
      });

      it('should reject request without API secret header', async () => {
        req.headers['x-api-key'] = 'ck_test123';

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'API key and secret are required',
            statusCode: 401
          })
        );
      });

      it('should reject request with invalid API key', async () => {
        req.headers['x-api-key'] = 'ck_invalid123';
        req.headers['x-api-secret'] = 'secret_invalid456';

        singleMock.mockResolvedValue({
          data: null,
          error: null
        });

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid API credentials',
            statusCode: 401
          })
        );
      });

      it('should reject request with wrong API secret', async () => {
        req.headers['x-api-key'] = 'ck_test123';
        req.headers['x-api-secret'] = 'wrong_secret';

        const mockApiClient = {
          id: 'client-123',
          api_key: 'ck_test123',
          api_secret_hash: '$2a$10$hashedSecret',
          is_active: true
        };

        singleMock.mockResolvedValue({
          data: mockApiClient,
          error: null
        });

        const bcrypt = require('bcryptjs');
        bcrypt.compare = jest.fn().mockResolvedValue(false);

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Invalid API credentials',
            statusCode: 401
          })
        );
      });

      it('should reject request for inactive API client', async () => {
        req.headers['x-api-key'] = 'ck_inactive123';
        req.headers['x-api-secret'] = 'secret_inactive456';

        const mockApiClient = {
          id: 'client-inactive',
          api_key: 'ck_inactive123',
          api_secret_hash: '$2a$10$hashedSecret',
          is_active: false
        };

        singleMock.mockResolvedValue({
          data: mockApiClient,
          error: null
        });

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'API client is inactive',
            statusCode: 403
          })
        );
      });

      it('should handle database errors gracefully', async () => {
        req.headers['x-api-key'] = 'ck_error123';
        req.headers['x-api-secret'] = 'secret_error456';

        singleMock.mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        });

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.any(Error)
        );
      });
    });

    describe('🔒 API Key Format Validation', () => {
      it('should accept properly formatted API key (ck_...)', async () => {
        req.headers['x-api-key'] = 'ck_1234567890abcdef';
        req.headers['x-api-secret'] = 'secret_1234567890abcdef';

        const mockApiClient = {
          id: 'client-format',
          api_key: 'ck_1234567890abcdef',
          api_secret_hash: '$2a$10$hashedSecret',
          is_active: true
        };

        singleMock.mockResolvedValue({
          data: mockApiClient,
          error: null
        });

        const bcrypt = require('bcryptjs');
        bcrypt.compare = jest.fn().mockResolvedValue(true);

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should handle API keys with various characters', async () => {
        req.headers['x-api-key'] = 'ck_ABCdef123-_';
        req.headers['x-api-secret'] = 'secret_ABCdef123-_';

        const mockApiClient = {
          id: 'client-chars',
          api_key: 'ck_ABCdef123-_',
          api_secret_hash: '$2a$10$hashedSecret',
          is_active: true
        };

        singleMock.mockResolvedValue({
          data: mockApiClient,
          error: null
        });

        const bcrypt = require('bcryptjs');
        bcrypt.compare = jest.fn().mockResolvedValue(true);

        await validateApiKey(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('logApiRequest', () => {
    describe('✅ Successful Logging', () => {
      it('should log successful API request', async () => {
        const apiClientId = 'client-log-123';
        const statusCode = 200;
        const responseTime = 150;
        const leadId = 'lead-log-456';

        await logApiRequest(apiClientId, req, statusCode, responseTime, leadId);

        expect(supabaseAdmin.from).toHaveBeenCalledWith('api_request_logs');
        expect(insertMock).toHaveBeenCalledWith({
          api_client_id: apiClientId,
          endpoint: '/api/v1/capture/lead',
          method: 'POST',
          status_code: statusCode,
          response_time_ms: responseTime,
          lead_id: leadId,
          error_message: null,
          ip_address: undefined,
          user_agent: undefined
        });
      });

      it('should log failed API request with error', async () => {
        const apiClientId = 'client-fail-123';
        const statusCode = 400;
        const responseTime = 50;
        const errorMessage = 'Validation failed';

        await logApiRequest(apiClientId, req, statusCode, responseTime, null, errorMessage);

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            api_client_id: apiClientId,
            status_code: 400,
            lead_id: null,
            error_message: errorMessage
          })
        );
      });

      it('should capture IP address and user agent', async () => {
        req.ip = '192.168.1.1';
        req.headers['user-agent'] = 'Mozilla/5.0';

        await logApiRequest('client-ip', req, 200, 100, 'lead-123');

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0'
          })
        );
      });

      it('should log bulk endpoint requests', async () => {
        req.originalUrl = '/api/v1/capture/leads/bulk';

        await logApiRequest('client-bulk', req, 200, 500, null);

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            endpoint: '/api/v1/capture/leads/bulk',
            response_time_ms: 500
          })
        );
      });
    });

    describe('❌ Error Handling', () => {
      it('should handle logging errors gracefully', async () => {
        insertMock.mockReturnValue({
          select: jest.fn().mockResolvedValue({
            error: { message: 'Insert failed' }
          })
        });

        // Should not throw error
        await expect(
          logApiRequest('client-err', req, 200, 100, 'lead-123')
        ).resolves.not.toThrow();
      });

      it('should continue even if logging fails', async () => {
        insertMock.mockImplementation(() => {
          throw new Error('Logging failed');
        });

        // Should not throw error
        await expect(
          logApiRequest('client-throw', req, 200, 100, 'lead-123')
        ).resolves.not.toThrow();
      });
    });

    describe('📊 Request Tracking', () => {
      it('should track response time accurately', async () => {
        const responseTime = 2500; // 2.5 seconds

        await logApiRequest('client-time', req, 200, responseTime, 'lead-time');

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            response_time_ms: 2500
          })
        );
      });

      it('should handle various HTTP status codes', async () => {
        const statusCodes = [200, 201, 400, 401, 403, 429, 500];

        for (const statusCode of statusCodes) {
          await logApiRequest('client-status', req, statusCode, 100, null);
        }

        expect(insertMock).toHaveBeenCalledTimes(statusCodes.length);
      });
    });
  });

  describe('🔐 Security Tests', () => {
    it('should not expose sensitive data in error messages', async () => {
      req.headers['x-api-key'] = 'ck_test123';
      req.headers['x-api-secret'] = 'secret_test456';

      singleMock.mockResolvedValue({
        data: null,
        error: null
      });

      await validateApiKey(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).not.toContain('secret_test456');
      expect(error.message).not.toContain('api_secret_hash');
    });

    it('should use timing-safe comparison for secrets', async () => {
      req.headers['x-api-key'] = 'ck_timing123';
      req.headers['x-api-secret'] = 'secret_timing456';

      const mockApiClient = {
        id: 'client-timing',
        api_key: 'ck_timing123',
        api_secret_hash: '$2a$10$hashedSecret',
        is_active: true
      };

      singleMock.mockResolvedValue({
        data: mockApiClient,
        error: null
      });

      // bcrypt.compare should be used (timing-safe)
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await validateApiKey(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'secret_timing456',
        '$2a$10$hashedSecret'
      );
    });

    it('should not allow empty API key or secret', async () => {
      req.headers['x-api-key'] = '';
      req.headers['x-api-secret'] = '';

      await validateApiKey(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401
        })
      );
    });
  });

  describe('⚡ Performance Tests', () => {
    it('should complete authentication quickly', async () => {
      req.headers['x-api-key'] = 'ck_perf123';
      req.headers['x-api-secret'] = 'secret_perf456';

      const mockApiClient = {
        id: 'client-perf',
        api_key: 'ck_perf123',
        api_secret_hash: '$2a$10$hashedSecret',
        is_active: true
      };

      singleMock.mockResolvedValue({
        data: mockApiClient,
        error: null
      });

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const startTime = Date.now();
      await validateApiKey(req, res, next);
      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 100ms excluding actual bcrypt)
      expect(duration).toBeLessThan(100);
    });
  });
});

