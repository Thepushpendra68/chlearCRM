const { extractTokenFromHeader, verifyAndGetUser, requireRole, requirePermission } = require('../utils/supabaseAuthUtils');
const ApiError = require('../utils/ApiError');
const { getUserProfile } = require('../config/supabase');
const { AuditActions, AuditSeverity, logAuditEvent } = require('../utils/auditLogger');

/**
 * Authentication middleware to verify Supabase JWT tokens
 * Also handles user impersonation if x-impersonate-user-id header is present
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      console.log('No token provided in auth header:', authHeader);
      throw ApiError.unauthorized('Access token is required');
    }

    console.log('Authenticating token:', token.substring(0, 50) + '...');
    console.log('Token length:', token.length);

    // Verify token and get user data with Supabase
    const user = await verifyAndGetUser(token);

    if (!user) {
      console.log('Token verification failed - no user returned');
      throw ApiError.unauthorized('Invalid or expired token');
    }

    if (!user.is_active) {
      console.log('User account is deactivated:', user.id);
      throw ApiError.unauthorized('User account is deactivated');
    }

    console.log('Authentication successful for user:', user.email, 'role:', user.role);

    // Add user to request object with enhanced data
    req.user = user;
    req.token = token; // Keep token for Supabase client operations

    // Handle impersonation if header is present
    const impersonateUserId = req.headers['x-impersonate-user-id'];
    if (impersonateUserId && req.user.role === 'super_admin') {
      console.log(`[IMPERSONATION] Super admin ${req.user.email} attempting to impersonate user ${impersonateUserId}`);

      // Get target user profile
      const targetUserProfile = await getUserProfile(impersonateUserId);

      if (!targetUserProfile) {
        throw ApiError.notFound('Target user not found');
      }

      // Prevent super_admin from impersonating another super_admin
      if (targetUserProfile.role === 'super_admin') {
        throw ApiError.forbidden('Cannot impersonate another super admin');
      }

      // Store original user
      req.originalUser = { ...req.user };

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

      console.log(`[IMPERSONATION] Successfully impersonating ${targetUserProfile.email}`);
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(ApiError.unauthorized('Authentication failed'));
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Role(s) that are allowed to access the route
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Super admin can access everything
    if (userRole === 'super_admin' || roles.includes(userRole)) {
      return next();
    }

    return next(ApiError.forbidden('Insufficient permissions'));
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const user = await verifyAndGetUser(token);

      if (user && user.is_active) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireRole,
  requirePermission
};
