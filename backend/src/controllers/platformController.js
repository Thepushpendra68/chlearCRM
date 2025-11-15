const platformService = require('../services/platformService');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');
const { validationResult } = require('express-validator');
const { BaseController, asyncHandler } = require('./baseController');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Platform Controller - Super Admin Operations
 * Extends BaseController for standardized patterns
 */
class PlatformController extends BaseController {
  createCompanyUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw ApiError.badRequest('Validation failed', errors.array());
    }

    const payload = {
      company_id: req.body.company_id,
      first_name: req.body.first_name.trim(),
      last_name: req.body.last_name.trim(),
      email: req.body.email.trim(),
      password: req.body.password,
      role: req.body.role || 'sales_rep',
      is_active: req.body.is_active !== undefined ? req.body.is_active : true
    };

    const result = await platformService.createUserForCompany(req.user, payload);

    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_CREATE_USER,
      resourceType: 'user',
      resourceId: result?.id,
      resourceName: `${payload.first_name} ${payload.last_name}`.trim() || payload.email,
      companyId: payload.company_id,
      severity: AuditSeverity.WARNING,
      details: {
        company_id: payload.company_id,
        email: payload.email,
        role: payload.role,
        is_active: payload.is_active
      }
    });

    this.created(res, result, 'User created successfully');
  });

  /**
   * Get all companies
   */
  getCompanies = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status = null } = req.query;

    const result = await platformService.getCompanies({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status
    });

    // Audit log
    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_VIEW_COMPANIES,
      resourceType: 'platform',
      details: { search, status },
    });

    this.paginated(res, result.companies, result.pagination, 200, 'Companies retrieved successfully');
  });

  /**
   * Get platform statistics
   */
  getPlatformStats = asyncHandler(async (req, res) => {
    const { range = '30d' } = req.query;
    const stats = await platformService.getPlatformStats(range);

    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_VIEW_STATS,
      resourceType: 'platform'
    });

    this.success(res, stats, 200, 'Platform statistics retrieved successfully');
  });

  /**
   * Get company details
   */
  getCompanyDetails = asyncHandler(async (req, res) => {
    const { companyId } = req.params;

    const details = await platformService.getCompanyDetails(companyId);

    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_VIEW_COMPANY,
      resourceType: 'company',
      resourceId: companyId,
      resourceName: details?.company?.name || null,
      companyId
    });

    this.success(res, details, 200, 'Company details retrieved successfully');
  });

  /**
   * Update company status
   */
  updateCompanyStatus = asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { status, reason } = req.body;

    const company = await platformService.updateCompanyStatus(companyId, status, reason);

    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_UPDATE_COMPANY_STATUS,
      resourceType: 'company',
      resourceId: companyId,
      resourceName: company?.name || null,
      companyId,
      severity: AuditSeverity.WARNING,
      details: { status, reason }
    });

    this.updated(res, company, `Company status updated to ${status}`);
  });

  /**
   * Search users across platform
   */
  searchUsers = asyncHandler(async (req, res) => {
    const { search = '', company_id = null, role = null, limit = 20 } = req.query;

    const users = await platformService.searchUsers({
      search,
      companyId: company_id,
      role,
      limit: parseInt(limit)
    });

    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_SEARCH_USERS,
      resourceType: 'platform',
      details: { search, company_id, role }
    });

    this.success(res, users, 200, 'Users searched successfully');
  });

  /**
   * Get audit logs
   */
  getAuditLogs = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 50,
      actor_id = null,
      action = null,
      resource_type = null,
      severity = null,
      start_date = null,
      end_date = null
    } = req.query;

    const result = await auditService.getLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      actorId: actor_id,
      action,
      resourceType: resource_type,
      severity,
      startDate: start_date,
      endDate: end_date
    });

    this.paginated(res, result.logs, result.pagination, 200, 'Audit logs retrieved successfully');
  });

  /**
   * Get recent platform activity
   */
  getRecentActivity = asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;

    const activity = await auditService.getRecentActivity(parseInt(limit));

    this.success(res, activity, 200, 'Recent activity retrieved successfully');
  });

  /**
   * Get lead import telemetry summary
   */
  getImportTelemetry = asyncHandler(async (req, res) => {
    const { range = '30d', limit = 20 } = req.query;
    const payload = await platformService.getImportTelemetry(range, parseInt(limit));

    await logAuditEvent(req, {
      action: AuditActions.IMPORT_TELEMETRY_VIEWED,
      resourceType: 'platform',
      details: {
        range,
        limit
      }
    });

    this.success(res, payload, 200, 'Import telemetry retrieved successfully');
  });

  /**
   * Start impersonating a user
   */
  startImpersonation = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Get target user profile
    const { getUserProfile } = require('../config/supabase');
    const targetUser = await getUserProfile(userId);

    if (!targetUser) {
      throw new ApiError('Target user not found', 404);
    }

    // Prevent super_admin from impersonating another super_admin
    if (targetUser.role === 'super_admin') {
      throw new ApiError('Cannot impersonate another super admin', 403);
    }

    // Log impersonation start
    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_IMPERSONATE_START,
      resourceType: 'user',
      resourceId: userId,
      resourceName: `${targetUser.first_name} ${targetUser.last_name}`.trim() || targetUser.email,
      companyId: targetUser.company_id,
      severity: AuditSeverity.WARNING,
      details: {
        target_user_email: targetUser.email,
        target_user_name: `${targetUser.first_name} ${targetUser.last_name}`,
        target_user_role: targetUser.role,
        target_user_company: targetUser.company_name
      },
      metadata: {
        target_user_company_id: targetUser.company_id
      }
    });

    this.success(res, {
      user: targetUser,
      message: 'Impersonation started successfully'
    }, 200, 'Impersonation started successfully');
  });
}

module.exports = new PlatformController();
