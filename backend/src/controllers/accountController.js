const { validationResult } = require('express-validator');
const accountService = require('../services/accountService');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Get all accounts with pagination, search, and filtering
 * @route   GET /api/accounts
 * @access  Private
 */
const getAccounts = async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      data: result.accounts,
      pagination: {
        current_page: parseInt(page),
        total_pages: result.totalPages,
        total_items: result.totalItems,
        items_per_page: parseInt(limit),
        has_next: parseInt(page) < result.totalPages,
        has_prev: parseInt(page) > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get account by ID
 * @route   GET /api/accounts/:id
 * @access  Private
 */
const getAccountById = async (req, res, next) => {
  try {
    const account = await accountService.getAccountById(req.params.id, req.user);

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new account
 * @route   POST /api/accounts
 * @access  Private
 */
const createAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        error: {
          message: `Please check the following fields: ${fieldErrors}`,
          code: 'VALIDATION_ERROR'
        }
      });
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

    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update account
 * @route   PUT /api/accounts/:id
 * @access  Private
 */
const updateAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      const fieldErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
        error: {
          message: `Please check the following fields: ${fieldErrors}`,
          code: 'VALIDATION_ERROR'
        }
      });
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

    res.json({
      success: true,
      data: result.updatedAccount,
      message: 'Account updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete account
 * @route   DELETE /api/accounts/:id
 * @access  Private (Admin only)
 */
const deleteAccount = async (req, res, next) => {
  try {
    const result = await accountService.deleteAccount(req.params.id, req.user);

    await logAuditEvent(req, {
      action: AuditActions.ACCOUNT_DELETED,
      resourceType: 'account',
      resourceId: result.deletedAccount.id,
      resourceName: result.deletedAccount.name,
      companyId: result.deletedAccount.company_id,
      severity: AuditSeverity.WARNING
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get account leads
 * @route   GET /api/accounts/:id/leads
 * @access  Private
 */
const getAccountLeads = async (req, res, next) => {
  try {
    const leads = await accountService.getAccountLeads(req.params.id, req.user);

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get account statistics
 * @route   GET /api/accounts/:id/stats
 * @access  Private
 */
const getAccountStats = async (req, res, next) => {
  try {
    const stats = await accountService.getAccountStats(req.params.id, req.user);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get account timeline
 * @route   GET /api/accounts/:id/timeline
 * @access  Private
 */
const getAccountTimeline = async (req, res, next) => {
  try {
    const timeline = await accountService.getAccountTimeline(req.params.id, req.user);

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountLeads,
  getAccountStats,
  getAccountTimeline
};

