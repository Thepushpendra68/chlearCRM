const platformService = require('../services/platformService');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');

/**
 * Platform Controller - Super Admin Operations
 */
class PlatformController {
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
}

module.exports = new PlatformController();
