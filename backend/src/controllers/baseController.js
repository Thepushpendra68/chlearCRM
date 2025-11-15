/**
 * Base Controller
 * Provides common functionality for all controllers
 * Includes error handling, response formatting, and async wrapper
 */

const ApiError = require('../utils/ApiError');
const response = require('../utils/responseFormatter');

/**
 * Async Handler Wrapper
 * Wraps async controller methods to catch errors automatically
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Base Controller Class
 * Extend this class to get consistent patterns
 */
class BaseController {
  /**
   * Success response
   */
  success(res, data, statusCode = 200, message = null, meta = null) {
    return response.success(res, data, statusCode, message, meta);
  }

  /**
   * Created response
   */
  created(res, data, message = 'Resource created successfully', meta = null) {
    return response.created(res, data, message, meta);
  }

  /**
   * Updated response
   */
  updated(res, data, message = 'Resource updated successfully', meta = null) {
    return response.updated(res, data, message, meta);
  }

  /**
   * Deleted response
   */
  deleted(res, message = 'Resource deleted successfully') {
    return response.deleted(res, message);
  }

  /**
   * Paginated response
   */
  paginated(res, data, pagination, statusCode = 200, message = null) {
    return response.paginated(res, data, pagination, statusCode, message);
  }

  /**
   * Error response
   */
  error(res, error, statusCode = null) {
    return response.error(res, error, statusCode);
  }

  /**
   * Unauthorized response
   */
  unauthorized(res, message = 'Unauthorized access') {
    return response.unauthorized(res, message);
  }

  /**
   * Forbidden response
   */
  forbidden(res, message = 'Access forbidden') {
    return response.forbidden(res, message);
  }

  /**
   * Not found response
   */
  notFound(res, message = 'Resource not found') {
    return response.notFound(res, message);
  }

  /**
   * Validation error response
   */
  validationError(res, message = 'Validation failed', errors = null) {
    return response.validationError(res, message, errors);
  }

  /**
   * Rate limit response
   */
  rateLimit(res, message = 'Too many requests') {
    return response.rateLimit(res, message);
  }

  /**
   * No content response
   */
  noContent(res) {
    return response.noContent(res);
  }

  /**
   * Custom response
   */
  custom(res, responseObj) {
    return response.custom(res, responseObj);
  }

  /**
   * Throw ApiError helper
   */
  throwError(message, statusCode = 500, isOperational = true) {
    throw new ApiError(message, statusCode, isOperational);
  }

  /**
   * Validate required fields
   */
  validateRequired(req, fields) {
    const missing = [];
    const errors = {};

    fields.forEach(field => {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missing.push(field);
        errors[field] = `${field} is required`;
      }
    });

    if (missing.length > 0) {
      this.validationError(req.res, 'Missing required fields', errors);
      return false;
    }

    return true;
  }

  /**
   * Parse pagination from query
   */
  getPagination(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Calculate pagination metadata
   */
  getPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Get user ID from request (common pattern)
   */
  getUserId(req) {
    return req.user?.id;
  }

  /**
   * Get company ID from request (common pattern)
   */
  getCompanyId(req) {
    return req.user?.company_id || req.user?.companyId || req.company?.id;
  }

  /**
   * Log controller action (common pattern)
   */
  logAction(req, action, data = {}) {
    const userId = this.getUserId(req);
    console.log(`[${action.toUpperCase()}] User: ${userId}`, data);
  }

  /**
   * Sanitize data for response (remove sensitive fields)
   */
  sanitize(data, fieldsToRemove = []) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, fieldsToRemove));
    }

    if (typeof data === 'object') {
      const sanitized = { ...data };
      fieldsToRemove.forEach(field => {
        delete sanitized[field];
      });
      return sanitized;
    }

    return data;
  }
}

module.exports = {
  asyncHandler,
  BaseController
};
