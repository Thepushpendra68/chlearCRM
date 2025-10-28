/**
 * Custom API Error class
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Create an API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for client handling
   */
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a bad request error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST') {
    return new ApiError(message, 400, code);
  }

  /**
   * Create an unauthorized error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(message, 401, code);
  }

  /**
   * Create a forbidden error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(message, 403, code);
  }

  /**
   * Create a not found error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {ApiError}
   */
  static notFound(message = 'Not Found', code = 'NOT_FOUND') {
    return new ApiError(message, 404, code);
  }

  /**
   * Create a conflict error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {ApiError}
   */
  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new ApiError(message, 409, code);
  }

  /**
   * Create an internal server error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {ApiError}
   */
  static internal(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
    return new ApiError(message, 500, code);
  }
}

module.exports = ApiError;