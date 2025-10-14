const platformService = require('../services/platformService');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');
const { validationResult } = require('express-validator');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Platform Controller - Super Admin Operations
 */
class PlatformController {
  createCompanyUser = async (req, res, next) => {
    try {
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

      res.status(201).json({
        success: true,
        data: result,
        message: 'User created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all companies
   */
  getCompanies = async (req, res, next) => {
    try {
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

      res.json({
        success: true,
        data: result.companies,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get platform statistics
   */
  getPlatformStats = async (req, res, next) => {
    try {
      const { range = '30d' } = req.query;
      const stats = await platformService.getPlatformStats(range);

      await logAuditEvent(req, {
        action: AuditActions.PLATFORM_VIEW_STATS,
        resourceType: 'platform'
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get company details
   */
  getCompanyDetails = async (req, res, next) => {
    try {
      const { companyId } = req.params;

      const details = await platformService.getCompanyDetails(companyId);

      await logAuditEvent(req, {
        action: AuditActions.PLATFORM_VIEW_COMPANY,
        resourceType: 'company',
        resourceId: companyId,
        resourceName: details?.company?.name || null,
        companyId
      });

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update company status
   */
  updateCompanyStatus = async (req, res, next) => {
    try {
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

      res.json({
        success: true,
        data: company,
        message: `Company status updated to ${status}`
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search users across platform
   */
  searchUsers = async (req, res, next) => {
    try {
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

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get audit logs
   */
  getAuditLogs = async (req, res, next) => {
    try {
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

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent platform activity
   */
  getRecentActivity = async (req, res, next) => {
    try {
      const { limit = 20 } = req.query;

      const activity = await auditService.getRecentActivity(parseInt(limit));

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Start impersonating a user
   */
  startImpersonation = async (req, res, next) => {
    try {
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

      res.json({
        success: true,
        data: {
          user: targetUser,
          message: 'Impersonation started successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new PlatformController();
