process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

jest.mock('../services/accountService');
jest.mock('../utils/auditLogger', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(true),
  AuditActions: {
    ACCOUNT_CREATED: 'account_created',
    ACCOUNT_UPDATED: 'account_updated',
    ACCOUNT_DELETED: 'account_deleted'
  },
  AuditSeverity: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
  }
}));

const { validationResult } = require('express-validator');
const accountService = require('../services/accountService');
const accountController = require('../controllers/accountController');
const ApiError = require('../utils/ApiError');

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('accountController', () => {
  let req, res, next;

  const mockUser = {
    id: 'user-123',
    company_id: 'company-1',
    role: 'company_admin'
  };

  beforeEach(() => {
    req = {
      user: mockUser,
      params: {},
      query: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAccounts', () => {
    it('should return accounts list with pagination', async () => {
      const mockAccounts = [
        { id: 'account-1', name: 'Account 1' },
        { id: 'account-2', name: 'Account 2' }
      ];

      accountService.getAccounts.mockResolvedValue({
        accounts: mockAccounts,
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        hasNext: false,
        hasPrev: false
      });

      req.query = { page: '1', limit: '20' };

      await accountController.getAccounts(req, res, next);

      expect(accountService.getAccounts).toHaveBeenCalledWith(
        mockUser,
        1,
        20,
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccounts,
        pagination: expect.any(Object)
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      accountService.getAccounts.mockRejectedValue(error);

      await accountController.getAccounts(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAccountById', () => {
    it('should return account by ID', async () => {
      const mockAccount = {
        id: 'account-1',
        name: 'Test Account',
        company_id: 'company-1'
      };

      accountService.getAccountById.mockResolvedValue(mockAccount);
      req.params.id = 'account-1';

      await accountController.getAccountById(req, res, next);

      expect(accountService.getAccountById).toHaveBeenCalledWith('account-1', mockUser);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccount
      });
    });

    it('should handle account not found', async () => {
      const error = new ApiError('Account not found', 404);
      accountService.getAccountById.mockRejectedValue(error);
      req.params.id = 'invalid-id';

      await accountController.getAccountById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createAccount', () => {
    it('should create account with valid data', async () => {
      const accountData = {
        name: 'New Account',
        industry: 'Technology',
        status: 'active'
      };

      const mockCreatedAccount = {
        id: 'account-new',
        ...accountData,
        company_id: 'company-1',
        created_at: new Date().toISOString()
      };

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      accountService.createAccount.mockResolvedValue(mockCreatedAccount);
      req.body = accountData;

      await accountController.createAccount(req, res, next);

      expect(accountService.createAccount).toHaveBeenCalledWith(accountData, mockUser);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedAccount,
        message: 'Account created successfully'
      });
    });

    it('should return validation errors', async () => {
      const validationErrors = [
        { path: 'name', param: 'name', msg: 'Name is required', value: undefined }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => validationErrors
      });

      req.body = {};

      await accountController.createAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'name', message: 'Name is required', value: undefined }
        ],
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please check the following fields: name: Name is required'
        }
      });
    });
  });

  describe('updateAccount', () => {
    it('should update account with valid data', async () => {
      const updateData = {
        name: 'Updated Account Name'
      };

      const mockUpdatedAccount = {
        id: 'account-1',
        name: 'Updated Account Name',
        company_id: 'company-1'
      };

      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      accountService.updateAccount.mockResolvedValue({
        updatedAccount: mockUpdatedAccount
      });
      req.params.id = 'account-1';
      req.body = updateData;

      await accountController.updateAccount(req, res, next);

      expect(accountService.updateAccount).toHaveBeenCalledWith(
        'account-1',
        updateData,
        mockUser
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedAccount,
        message: 'Account updated successfully'
      });
    });
  });

  describe('deleteAccount', () => {
    it('should delete account', async () => {
      const mockDeletedAccount = {
        id: 'account-1',
        name: 'Test Account',
        company_id: 'company-1'
      };
      accountService.deleteAccount.mockResolvedValue({
        deletedAccount: mockDeletedAccount
      });
      req.params.id = 'account-1';

      await accountController.deleteAccount(req, res, next);

      expect(accountService.deleteAccount).toHaveBeenCalledWith('account-1', mockUser);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account deleted successfully'
      });
    });
  });

  describe('getAccountLeads', () => {
    it('should return leads for an account', async () => {
      const mockLeads = [
        { id: 'lead-1', name: 'Lead 1', account_id: 'account-1' }
      ];

      accountService.getAccountLeads.mockResolvedValue(mockLeads);
      req.params.id = 'account-1';

      await accountController.getAccountLeads(req, res, next);

      expect(accountService.getAccountLeads).toHaveBeenCalledWith('account-1', mockUser);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLeads
      });
    });
  });

  describe('getAccountStats', () => {
    it('should return account statistics', async () => {
      const mockStats = {
        leads_count: 5,
        activities_count: 10,
        tasks_count: 3,
        child_accounts_count: 2
      };

      accountService.getAccountStats.mockResolvedValue(mockStats);
      req.params.id = 'account-1';

      await accountController.getAccountStats(req, res, next);

      expect(accountService.getAccountStats).toHaveBeenCalledWith('account-1', mockUser);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('getAccountTimeline', () => {
    it('should return account timeline', async () => {
      const mockTimeline = [
        {
          id: 'event-1',
          type: 'audit',
          event_type: 'account_created',
          title: 'Account Created',
          timestamp: new Date().toISOString()
        }
      ];

      accountService.getAccountTimeline.mockResolvedValue(mockTimeline);
      req.params.id = 'account-1';

      await accountController.getAccountTimeline(req, res, next);

      expect(accountService.getAccountTimeline).toHaveBeenCalledWith('account-1', mockUser);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTimeline
      });
    });
  });
});

