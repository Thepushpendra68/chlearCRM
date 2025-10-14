const { getUserProfile } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Impersonation Middleware
 * Allows super admins to view the system as another user
 */
const impersonate = async (req, res, next) => {
  try {
    const impersonateUserId = req.headers['x-impersonate-user-id'];

    // Skip if no impersonation header
    if (!impersonateUserId) {
      return next();
    }

    // Skip if no user (not authenticated)
    if (!req.user) {
      return next();
    }

    // Only super admins can impersonate
    if (req.user.role !== 'super_admin') {
      return next(new ApiError('Only super admins can impersonate users', 403));
    }

    // Store original user
    req.originalUser = { ...req.user };

    // Get target user profile
    const targetUserProfile = await getUserProfile(impersonateUserId);

    if (!targetUserProfile) {
      return next(new ApiError('Target user not found', 404));
    }

    // Prevent super_admin from impersonating another super_admin
    if (targetUserProfile.role === 'super_admin') {
      return next(new ApiError('Cannot impersonate another super admin', 403));
    }

    // Replace req.user with target user
    req.user = {
      ...targetUserProfile,
      isImpersonated: true,
      impersonatedBy: req.originalUser.id
    };
    req.impersonationStartedAt = Date.now();

    // Log impersonation
    await logAuditEvent(req, {
      action: AuditActions.PLATFORM_IMPERSONATE_SWITCH,
      resourceType: 'user',
      resourceId: impersonateUserId,
      resourceName: `${targetUserProfile.first_name} ${targetUserProfile.last_name}`.trim() || targetUserProfile.email,
      companyId: targetUserProfile.company_id,
      severity: AuditSeverity.WARNING,
      details: {
        target_user_email: targetUserProfile.email,
        target_user_name: `${targetUserProfile.first_name} ${targetUserProfile.last_name}`
      },
      metadata: {
        target_user_company_id: targetUserProfile.company_id
      }
    });

    next();
  } catch (error) {
    console.error('Impersonation error:', error);
    next(error);
  }
};

/**
 * End impersonation middleware
 */
const endImpersonation = async (req, res, next) => {
  try {
    if (req.originalUser) {
      await logAuditEvent(req, {
        action: AuditActions.PLATFORM_IMPERSONATE_END,
        resourceType: 'user',
        resourceId: req.user.id,
        resourceName: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.email,
        companyId: req.user.company_id,
        severity: AuditSeverity.INFO,
        details: {
          duration_ms: req.impersonationStartedAt
            ? Date.now() - req.impersonationStartedAt
            : undefined
        }
      });
    }

    res.json({
      success: true,
      message: 'Impersonation ended'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  impersonate,
  endImpersonation
};
