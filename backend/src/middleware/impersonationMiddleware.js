const { getUserProfile } = require('../config/supabase');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');

/**
 * Impersonation Middleware
 * Allows super admins to view the system as another user
 */
const impersonate = async (req, res, next) => {
  try {
    const impersonateUserId = req.headers['x-impersonate-user-id'];

    // Only super admins can impersonate
    if (req.user.role !== 'super_admin') {
      return next(new ApiError('Only super admins can impersonate users', 403));
    }

    if (!impersonateUserId) {
      return next();
    }

    // Store original user
    req.originalUser = { ...req.user };

    // Get target user profile
    const targetUserProfile = await getUserProfile(impersonateUserId);

    if (!targetUserProfile) {
      return next(new ApiError('Target user not found', 404));
    }

    // Replace req.user with target user
    req.user = {
      ...targetUserProfile,
      isImpersonated: true,
      impersonatedBy: req.originalUser.id
    };

    // Log impersonation
    await auditService.logEvent({
      actorId: req.originalUser.id,
      actorEmail: req.originalUser.email,
      actorRole: req.originalUser.role,
      action: 'impersonate_user',
      resourceType: 'user',
      resourceId: impersonateUserId,
      details: {
        target_user_email: targetUserProfile.email,
        target_user_name: `${targetUserProfile.first_name} ${targetUserProfile.last_name}`
      },
      isImpersonation: true,
      impersonatedUserId: impersonateUserId,
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
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
      await auditService.logEvent({
        actorId: req.originalUser.id,
        actorEmail: req.originalUser.email,
        actorRole: req.originalUser.role,
        action: 'end_impersonation',
        resourceType: 'user',
        resourceId: req.user.id,
        severity: 'info',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
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
