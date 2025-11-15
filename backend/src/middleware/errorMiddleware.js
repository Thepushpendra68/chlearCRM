/**
 * Global error handling middleware
 * Enhanced with comprehensive error handling and response formatting
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
 * Handle 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Global error handler middleware
 * Catches and formats all errors from the application
 * This should be registered AFTER all routes
 */
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error details
  console.error(`[ERROR] ${error.message}`);
  console.error(`[ERROR] Stack: ${error.stack}`);
  console.error(`[ERROR] URL: ${req.method} ${req.originalUrl}`);
  console.error(`[ERROR] User: ${req.user?.id || 'anonymous'}`);

  // ApiError - already formatted with status code
  if (error instanceof ApiError) {
    return response.error(res, error);
  }

  // Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    const message = 'Resource not found';
    return response.notFound(res, message);
  }

  // Mongoose ValidationError
  if (error.name === 'ValidationError') {
    const errors = {};
    Object.keys(error.errors).forEach(key => {
      errors[key] = error.errors[key].message;
    });
    return response.validationError(res, 'Validation failed', errors);
  }

  // Mongoose duplicate key error (code 11000)
  if (error.code === 11000 || error.code === '23505') {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    const message = `${field} already exists`;
    return response.validationError(res, message, { [field]: message });
  }

  // PostgreSQL unique violation (23505)
  if (error.code === '23505') {
    const message = 'Resource already exists';
    return response.validationError(res, message);
  }

  // PostgreSQL foreign key violation (23503)
  if (error.code === '23503') {
    const message = 'Referenced resource does not exist';
    return response.validationError(res, message);
  }

  // PostgreSQL not null violation (23502)
  if (error.code === '23502') {
    const field = error.column || 'field';
    const message = `${field} is required`;
    return response.validationError(res, message, { [field]: message });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return response.unauthorized(res, message);
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return response.unauthorized(res, message);
  }

  // SyntaxError (invalid JSON in request body)
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.validationError(res, 'Invalid JSON in request body');
  }

  // TypeError (common JavaScript errors)
  if (error instanceof TypeError) {
    const message = 'Invalid request data';
    return response.validationError(res, message);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  // Don't leak error details in production
  const responseData = {
    success: false,
    statusCode,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name || 'Error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : message,
      statusCode
    }
  };

  // Include additional details in development
  if (process.env.NODE_ENV !== 'production') {
    responseData.error.stack = error.stack;
    responseData.error.url = req.originalUrl;
    responseData.error.method = req.method;
  }

  res.status(statusCode).json(responseData);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Rejection:', err.message);
    console.log('Shutting down server due to unhandled promise rejection');
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err.message);
    console.log('Shutting down server due to uncaught exception');
    process.exit(1);
  });
};

module.exports = {
  asyncHandler,
  notFound,
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException
};