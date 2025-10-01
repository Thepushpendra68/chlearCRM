const { extractTokenFromHeader, verifyAndGetUser, requireRole, requirePermission } = require('../utils/supabaseAuthUtils');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware to verify Supabase JWT tokens
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