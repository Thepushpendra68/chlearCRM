/**
 * Response Formatter
 * Standardizes API response formats across all endpoints
 * Ensures consistent data structure for frontend consumption
 */

const ApiError = require('./ApiError');

/**
 * Success Response
 * Standard format for successful responses
 */
const success = (res, data, statusCode = 200, message = null, meta = null) => {
  const response = {
    success: true,
    statusCode,
    timestamp: new Date().toISOString(),
    data
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created Response
 * For POST requests that create resources
 */
const created = (res, data, message = 'Resource created successfully', meta = null) => {
  const response = {
    success: true,
    statusCode: 201,
    timestamp: new Date().toISOString(),
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(201).json(response);
};

/**
 * Updated Response
 * For PUT/PATCH requests that update resources
 */
const updated = (res, data, message = 'Resource updated successfully', meta = null) => {
  const response = {
    success: true,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(200).json(response);
};

/**
 * Deleted Response
 * For DELETE requests
 */
const deleted = (res, message = 'Resource deleted successfully') => {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    message
  });
};

/**
 * Paginated Response
 * For list endpoints with pagination
 */
const paginated = (res, data, pagination, statusCode = 200, message = null) => {
  const response = {
    success: true,
    statusCode,
    timestamp: new Date().toISOString(),
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || 0,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    }
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error Response
 * Standard format for error responses
 */
const error = (res, error, statusCode = null) => {
  // If error is already an ApiError, extract details
  let errorData;
  let code = statusCode;

  if (error instanceof ApiError) {
    errorData = {
      name: error.name || 'ApiError',
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational || false
    };
    code = error.statusCode || 500;
  } else if (error.name === 'ValidationError') {
    // Mongoose validation error
    errorData = {
      name: 'ValidationError',
      message: error.message,
      statusCode: 400,
      errors: error.errors
    };
    code = 400;
  } else if (error.code === '23505') {
    // PostgreSQL unique violation
    errorData = {
      name: 'DuplicateError',
      message: 'Resource already exists',
      statusCode: 409,
      detail: error.detail
    };
    code = 409;
  } else if (error.code === '23503') {
    // PostgreSQL foreign key violation
    errorData = {
      name: 'ForeignKeyError',
      message: 'Referenced resource does not exist',
      statusCode: 400,
      detail: error.detail
    };
    code = 400;
  } else {
    // Generic error
    errorData = {
      name: error.name || 'Error',
      message: error.message || 'Internal server error',
      statusCode: code || 500
    };
    code = code || 500;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !errorData.isOperational) {
    errorData.message = 'Something went wrong';
    delete errorData.stack;
    delete errorData.detail;
  }

  return res.status(code).json({
    success: false,
    statusCode: code,
    timestamp: new Date().toISOString(),
    error: errorData
  });
};

/**
 * Unauthorized Response
 */
const unauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    statusCode: 401,
    timestamp: new Date().toISOString(),
    error: {
      name: 'UnauthorizedError',
      message,
      statusCode: 401
    }
  });
};

/**
 * Forbidden Response
 */
const forbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    statusCode: 403,
    timestamp: new Date().toISOString(),
    error: {
      name: 'ForbiddenError',
      message,
      statusCode: 403
    }
  });
};

/**
 * Not Found Response
 */
const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    error: {
      name: 'NotFoundError',
      message,
      statusCode: 404
    }
  });
};

/**
 * Validation Error Response
 */
const validationError = (res, message = 'Validation failed', errors = null) => {
  const response = {
    success: false,
    statusCode: 400,
    timestamp: new Date().toISOString(),
    error: {
      name: 'ValidationError',
      message,
      statusCode: 400
    }
  };

  if (errors) {
    response.error.errors = errors;
  }

  return res.status(400).json(response);
};

/**
 * Rate Limit Response
 */
const rateLimit = (res, message = 'Too many requests') => {
  return res.status(429).json({
    success: false,
    statusCode: 429,
    timestamp: new Date().toISOString(),
    error: {
      name: 'RateLimitError',
      message,
      statusCode: 429
    }
  });
};

/**
 * No Content Response
 * For successful DELETE with no response body
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Custom Response
 * For complex response structures
 */
const custom = (res, response) => {
  return res.status(response.statusCode || 200).json(response);
};

module.exports = {
  success,
  created,
  updated,
  deleted,
  paginated,
  error,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  rateLimit,
  noContent,
  custom
};
