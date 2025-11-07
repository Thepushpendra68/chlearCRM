process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

const ApiError = require('../utils/ApiError');
const { supabaseAdmin } = require('../config/supabase');
const accountService = require('../services/accountService');

describe('accountService', () => {
  let consoleErrorSpy;

  const mockCurrentUser = {
    id: 'user-123',
    company_id: 'company-1',
    role: 'company_admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getAccounts', () => {
    it('should fetch accounts with pagination and filters', async () => {
      const mockAccounts = [
        { id: 'account-1', name: 'Test Account 1', company_id: 'company-1', status: 'active' },
        { id: 'account-2', name: 'Test Account 2', company_id: 'company-1', status: 'active' }
      ];

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock = jest.fn().mockReturnThis();
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockAccounts,
        error: null
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock
      });

      const result = await accountService.getAccounts(mockCurrentUser, 1, 20, {});

      expect(supabaseAdmin.from).toHaveBeenCalledWith('accounts');
      expect(eqMock).toHaveBeenCalledWith('company_id', 'company-1');
      expect(result.data).toEqual(mockAccounts);
    });

    it('should filter accounts by status', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock = jest.fn().mockReturnThis();
      const rangeMock = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock
      });

      await accountService.getAccounts(mockCurrentUser, 1, 20, { status: 'active' });

      expect(eqMock).toHaveBeenCalledWith('status', 'active');
    });

    it('should filter accounts by industry', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock = jest.fn().mockReturnThis();
      const rangeMock = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock
      });

      await accountService.getAccounts(mockCurrentUser, 1, 20, { industry: 'Technology' });

      expect(eqMock).toHaveBeenCalledWith('industry', 'Technology');
    });
  });

  describe('getAccountById', () => {
    it('should fetch account by ID', async () => {
      const mockAccount = {
        id: 'account-1',
        name: 'Test Account',
        company_id: 'company-1'
      };

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: mockAccount,
        error: null
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock
      });

      const result = await accountService.getAccountById('account-1', mockCurrentUser);

      expect(result).toEqual(mockAccount);
      expect(eqMock).toHaveBeenCalledWith('company_id', 'company-1');
    });

    it('should throw ApiError if account not found', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock
      });

      await expect(
        accountService.getAccountById('invalid-id', mockCurrentUser)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('createAccount', () => {
    it('should create a new account', async () => {
      const accountData = {
        name: 'New Account',
        industry: 'Technology',
        status: 'active',
        company_id: 'company-1'
      };

      const mockCreatedAccount = {
        id: 'account-new',
        ...accountData,
        created_at: new Date().toISOString()
      };

      const selectMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: mockCreatedAccount,
        error: null
      });
      const insertMock = jest.fn().mockReturnValue({
        select: selectMock,
        single: singleMock
      });

      supabaseAdmin.from.mockReturnValue({
        insert: insertMock
      });

      const result = await accountService.createAccount(accountData, mockCurrentUser);

      expect(result).toEqual(mockCreatedAccount);
      expect(insertMock).toHaveBeenCalled();
    });

    it('should validate parent account belongs to same company', async () => {
      const accountData = {
        name: 'Child Account',
        parent_account_id: 'parent-account-1',
        company_id: 'company-1'
      };

      // Mock parent account check - should fail
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'accounts') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock
          };
        }
      });

      await expect(
        accountService.createAccount(accountData, mockCurrentUser)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updateAccount', () => {
    it('should update an existing account', async () => {
      const existingAccount = {
        id: 'account-1',
        name: 'Old Name',
        company_id: 'company-1'
      };

      const updatedAccount = {
        ...existingAccount,
        name: 'New Name'
      };

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: existingAccount, error: null }) // For existence check
        .mockResolvedValueOnce({ data: updatedAccount, error: null }); // For update

      const updateMock = jest.fn().mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
        update: updateMock
      });

      const result = await accountService.updateAccount(
        'account-1',
        { name: 'New Name' },
        mockCurrentUser
      );

      expect(result).toEqual(updatedAccount);
    });

    it('should throw ApiError if account not found', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock
      });

      await expect(
        accountService.updateAccount('invalid-id', { name: 'New Name' }, mockCurrentUser)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account', async () => {
      const existingAccount = {
        id: 'account-1',
        name: 'Test Account',
        company_id: 'company-1'
      };

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: existingAccount,
        error: null
      });

      const deleteMock = jest.fn().mockReturnValue({
        eq: eqMock
      });

      supabaseAdmin.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
        delete: deleteMock
      });

      await accountService.deleteAccount('account-1', mockCurrentUser);

      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('getAccountLeads', () => {
    it('should fetch leads associated with an account', async () => {
      const mockLeads = [
        { id: 'lead-1', name: 'Lead 1', account_id: 'account-1' },
        { id: 'lead-2', name: 'Lead 2', account_id: 'account-1' }
      ];

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock = jest.fn().mockReturnThis();
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockLeads,
        error: null
      });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'accounts') {
          return {
            select: selectMock,
            eq: eqMock,
            single: jest.fn().mockResolvedValue({ data: { id: 'account-1' }, error: null })
          };
        }
        if (table === 'leads') {
          return {
            select: selectMock,
            eq: eqMock,
            order: orderMock,
            range: rangeMock
          };
        }
      });

      const result = await accountService.getAccountLeads('account-1', mockCurrentUser);

      expect(result).toEqual(mockLeads);
    });
  });

  describe('getAccountStats', () => {
    it('should fetch account statistics', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'account-1' },
        error: null
      });

      const countMock = jest.fn().mockResolvedValue({
        count: 5,
        error: null
      });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'accounts') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock
          };
        }
        // For leads, activities, tasks, child accounts
        return {
          select: jest.fn().mockReturnThis(),
          eq: eqMock,
          count: countMock
        };
      });

      const result = await accountService.getAccountStats('account-1', mockCurrentUser);

      expect(result).toHaveProperty('leads_count');
      expect(result).toHaveProperty('activities_count');
      expect(result).toHaveProperty('tasks_count');
      expect(result).toHaveProperty('child_accounts_count');
    });
  });

  describe('getAccountTimeline', () => {
    it('should fetch account timeline with activities, tasks, and audit logs', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: 'account_created',
          resource_type: 'account',
          resource_id: 'account-1',
          created_at: new Date().toISOString(),
          actor_id: 'user-123',
          actor_email: 'user@example.com',
          actor_role: 'admin',
          details: { resource_name: 'Test Account' }
        }
      ];

      const mockActivities = [
        {
          id: 'activity-1',
          account_id: 'account-1',
          subject: 'Test Activity',
          activity_type: 'call',
          created_at: new Date().toISOString()
        }
      ];

      const mockTasks = [
        {
          id: 'task-1',
          account_id: 'account-1',
          title: 'Test Task',
          task_type: 'follow_up',
          created_at: new Date().toISOString()
        }
      ];

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const orderMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue({
        data: mockAuditLogs,
        error: null
      });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === 'accounts') {
          return {
            select: selectMock,
            eq: eqMock,
            single: jest.fn().mockResolvedValue({ data: { id: 'account-1' }, error: null })
          };
        }
        if (table === 'audit_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: eqMock,
            order: orderMock,
            limit: limitMock
          };
        }
        if (table === 'activities') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: eqMock,
            order: orderMock,
            limit: jest.fn().mockResolvedValue({ data: mockActivities, error: null })
          };
        }
        if (table === 'tasks') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: eqMock,
            order: orderMock,
            limit: jest.fn().mockResolvedValue({ data: mockTasks, error: null })
          };
        }
      });

      const result = await accountService.getAccountTimeline('account-1', mockCurrentUser);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

