const platformService = require('../services/platformService');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');
const { validationResult } = require('express-validator');

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

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'platform_create_user',
        resourceType: 'user',
        resourceId: result?.id,
        details: {
          company_id: payload.company_id,
          email: payload.email,
          role: payload.role,
          is_active: payload.is_active
        },
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'view_all_companies',
        resourceType: 'platform',
        details: { search, status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
      const stats = await platformService.getPlatformStats();

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'view_platform_stats',
        resourceType: 'platform',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'view_company_details',
        resourceType: 'company',
        resourceId: companyId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'update_company_status',
        resourceType: 'company',
        resourceId: companyId,
        details: { status, reason },
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'search_platform_users',
        resourceType: 'platform',
        details: { search, company_id, role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'start_impersonation',
        resourceType: 'user',
        resourceId: userId,
        details: {
          target_user_email: targetUser.email,
          target_user_name: `${targetUser.first_name} ${targetUser.last_name}`,
          target_user_role: targetUser.role,
          target_user_company: targetUser.company_name
        },
        isImpersonation: true,
        impersonatedUserId: userId,
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
