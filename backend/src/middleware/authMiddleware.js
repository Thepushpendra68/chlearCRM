const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const ApiError = require('../utils/ApiError');
const db = require('../config/database');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists and is active
    const user = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active')
      .where('id', decoded.userId)
      .first();

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.is_active) {
      throw ApiError.unauthorized('User account is deactivated');
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Token expired'));
    } else {
      next(error);
    }
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

    if (!roles.includes(userRole)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
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
      const decoded = verifyToken(token);
      const user = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active')
        .where('id', decoded.userId)
        .first();

      if (user && user.is_active) {
        req.user = user;
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
  optionalAuth
};