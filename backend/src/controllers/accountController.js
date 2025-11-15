const { validationResult } = require('express-validator');
const accountService = require('../services/accountService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');
const { BaseController, asyncHandler } = require('./baseController');

/**
 * Account Controller
 * Handles account management operations
 * Extends BaseController for standardized patterns
 */
class AccountController extends BaseController {
  /**
   * Get all accounts with pagination, search, and filtering
   */
  getAccounts = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      assigned_to = '',
      parent_account_id = '',
      industry = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search,
      status,
      assigned_to,
      parent_account_id,
      industry,
      sort_by,
      sort_order
    };

    const result = await accountService.getAccounts(
      req.user,
      parseInt(page),
      parseInt(limit),
      filters
    );

    this.paginated(res, result.accounts, parseInt(page), parseInt(limit), result.totalItems, 200);
  });

  /**
   * Get account by ID
   */
  getAccountById = asyncHandler(async (req, res) => {
    const account = await accountService.getAccountById(req.params.id, req.user);

    this.success(res, account, 200);
  });

  /**
   * Create new account
   */
  createAccount = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      throw ApiError.badRequest(`Please check the following fields: ${fieldErrors}`, errorMessages);
    }

    const account = await accountService.createAccount(req.body, req.user);

    await logAuditEvent(req, {
      action: AuditActions.ACCOUNT_CREATED,
      resourceType: 'account',
      resourceId: account.id,
      resourceName: account.name,
      companyId: account.company_id,
      details: {
        status: account.status,
        assigned_to: account.assigned_to,
        parent_account_id: account.parent_account_id
      },
      metadata: {
        created_by: account.created_by
      }
    });

    this.created(res, account, 'Account created successfully');
  });

  /**
   * Update account
   */
  updateAccount = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      throw ApiError.badRequest(`Please check the following fields: ${fieldErrors}`, errorMessages);
    }

    const result = await accountService.updateAccount(req.params.id, req.body, req.user);

    await logAuditEvent(req, {
      action: AuditActions.ACCOUNT_UPDATED,
      resourceType: 'account',
      resourceId: result.updatedAccount.id,
      resourceName: result.updatedAccount.name,
      companyId: result.updatedAccount.company_id,
      details: {
        status: result.updatedAccount.status,
        assigned_to: result.updatedAccount.assigned_to,
        parent_account_id: result.updatedAccount.parent_account_id
      }
    });

    this.success(res, result.updatedAccount, 200, 'Account updated successfully');
  });

  /**
   * Delete account
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const result = await accountService.deleteAccount(req.params.id, req.user);

    await logAuditEvent(req, {
      action: AuditActions.ACCOUNT_DELETED,
      resourceType: 'account',
      resourceId: result.deletedAccount.id,
      resourceName: result.deletedAccount.name,
      companyId: result.deletedAccount.company_id,
      severity: AuditSeverity.WARNING
    });

    this.success(res, null, 200, 'Account deleted successfully');
  });

  /**
   * Get account leads
   */
  getAccountLeads = asyncHandler(async (req, res) => {
    const leads = await accountService.getAccountLeads(req.params.id, req.user);

    this.success(res, leads, 200);
  });

  /**
   * Get account statistics
   */
  getAccountStats = asyncHandler(async (req, res) => {
    const stats = await accountService.getAccountStats(req.params.id, req.user);

    this.success(res, stats, 200);
  });

  /**
   * Get account timeline
   */
  getAccountTimeline = asyncHandler(async (req, res) => {
    const timeline = await accountService.getAccountTimeline(req.params.id, req.user);

    this.success(res, timeline, 200);
  });
}

module.exports = new AccountController();

