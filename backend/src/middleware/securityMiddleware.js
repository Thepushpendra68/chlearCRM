const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

/**
 * Security Middleware for AI Endpoints
 *
 * Provides comprehensive security features:
 * - Input sanitization
 * - Per-endpoint rate limiting
 * - Request size limits
 * - XSS protection headers
 * - IP allowlisting for admin endpoints
 */

// ============================================================================
// 1. INPUT SANITIZATION MIDDLEWARE
// ============================================================================

/**
 * Sanitize request body to prevent injection attacks
 * Removes dangerous patterns, limits field sizes, and validates data types
 */
const sanitizeInput = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  try {
    const sanitizedBody = {};

    for (const [key, value] of Object.entries(req.body)) {
      // Skip sanitization for null/undefined
      if (value === null || value === undefined) {
        sanitizedBody[key] = value;
        continue;
      }

      // Handle strings
      if (typeof value === 'string') {
        let sanitized = value;

        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');

        // Remove dangerous HTML/script tags
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
        sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove inline event handlers

        // Limit field size (max 10000 characters for AI input, 500 for others)
        const maxLength = key === 'userMessage' || key === 'message' || key === 'query' ? 10000 : 500;
        if (sanitized.length > maxLength) {
          sanitized = sanitized.substring(0, maxLength);
        }

        // Escape HTML entities for display fields
        if (key === 'userMessage' || key === 'message') {
          // For AI input, keep as-is but remove dangerous patterns
          sanitized = sanitized.trim();
        } else {
          // For other fields, escape HTML
          sanitized = validator.escape(sanitized);
        }

        sanitizedBody[key] = sanitized;
      }
      // Handle arrays (recursive sanitization)
      else if (Array.isArray(value)) {
        sanitizedBody[key] = value.map(item => {
          if (typeof item === 'string') {
            return validator.escape(item.substring(0, 500));
          }
          return item;
        });
      }
      // Handle objects (recursive sanitization)
      else if (typeof value === 'object') {
        const sanitizedObject = {};
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (typeof nestedValue === 'string') {
            sanitizedObject[nestedKey] = validator.escape(nestedValue.substring(0, 500));
          } else {
            sanitizedObject[nestedKey] = nestedValue;
          }
        }
        sanitizedBody[key] = sanitizedObject;
      }
      // Handle numbers, booleans (no sanitization needed)
      else {
        sanitizedBody[key] = value;
      }
    }

    req.body = sanitizedBody;
    next();
  } catch (error) {
    console.error('[SECURITY] Input sanitization error:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid input data format'
    });
  }
};

// ============================================================================
// 2. PER-ENDPOINT RATE LIMITING
// ============================================================================

/**
 * Rate limiter for AI message processing
 * Prevents abuse of expensive AI API calls
 */
const aiMessageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.AI_MESSAGE_RATE_LIMIT) || 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many AI requests. Please wait before trying again.',
    retryAfter: 60
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  }
});

/**
 * Rate limiter for voice endpoints
 * More restrictive due to processing requirements
 */
const voiceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.VOICE_RATE_LIMIT) || 15, // 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many voice requests. Please wait before trying again.',
    retryAfter: 60
  }
});

/**
 * Rate limiter for admin endpoints
 * More generous for internal operations
 */
const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.ADMIN_RATE_LIMIT) || 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many admin requests. Please slow down.',
    retryAfter: 60
  }
});

/**
 * Rate limiter for metrics endpoints
 * Prevent excessive monitoring calls
 */
const metricsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.METRICS_RATE_LIMIT) || 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many metrics requests.',
    retryAfter: 60
  }
});

// ============================================================================
// 3. REQUEST SIZE LIMITS
// ============================================================================

/**
 * Validate request body size to prevent memory exhaustion
 */
const validateRequestSize = (maxSizeKB = 100) => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];

    if (contentLength) {
      const sizeKB = parseInt(contentLength) / 1024;
      const maxSize = parseInt(process.env.MAX_REQUEST_SIZE_KB) || maxSizeKB;

      if (sizeKB > maxSize) {
        return res.status(413).json({
          success: false,
          error: `Request body too large. Maximum size: ${maxSize}KB`,
          maxSize: `${maxSize}KB`,
          receivedSize: `${sizeKB.toFixed(2)}KB`
        });
      }
    }

    next();
  };
};

/**
 * Validate JSON payload structure
 */
const validateJsonPayload = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];

    if (contentType && contentType.includes('application/json')) {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON payload'
        });
      }
    }
  }

  next();
};

// ============================================================================
// 4. XSS PROTECTION HEADERS
// ============================================================================

/**
 * Set comprehensive security headers
 * Uses helmet middleware with custom configuration
 */
const setSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for iframes
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Additional XSS protection headers
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// ============================================================================
// 5. IP ALLOWLISTING FOR ADMIN ENDPOINTS
// ============================================================================

/**
 * IP allowlist middleware
 * Restricts admin endpoints to specific IP addresses
 */
const ipAllowlist = (req, res, next) => {
  // Get allowed IPs from environment variable
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS
    ? process.env.ADMIN_ALLOWED_IPS.split(',').map(ip => ip.trim())
    : [];

  // If no IPs configured, allow all (development mode)
  if (allowedIPs.length === 0 || allowedIPs[0] === '*') {
    return next();
  }

  // Get client IP
  const clientIP = req.ip ||
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.connection.remoteAddress;

  // Normalize IPv6 localhost
  const normalizedIP = clientIP === '::1' || clientIP === '::ffff:127.0.0.1'
    ? '127.0.0.1'
    : clientIP;

  // Check if IP is allowed
  if (!allowedIPs.includes(normalizedIP)) {
    console.warn(`[SECURITY] Blocked admin access from unauthorized IP: ${normalizedIP}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied. Your IP address is not authorized for admin operations.'
    });
  }

  next();
};

/**
 * Role-based admin check
 * Ensures user has admin privileges
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const adminRoles = ['super_admin', 'admin'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required'
    });
  }

  next();
};

// ============================================================================
// 6. COMBINED MIDDLEWARE STACKS
// ============================================================================

/**
 * Complete security stack for AI message endpoints
 */
const aiEndpointSecurity = [
  setSecurityHeaders,
  additionalSecurityHeaders,
  validateRequestSize(100), // 100KB max for AI messages
  validateJsonPayload,
  sanitizeInput,
  aiMessageRateLimit
];

/**
 * Complete security stack for voice endpoints
 */
const voiceEndpointSecurity = [
  setSecurityHeaders,
  additionalSecurityHeaders,
  validateRequestSize(500), // 500KB max for voice data
  validateJsonPayload,
  sanitizeInput,
  voiceRateLimit
];

/**
 * Complete security stack for admin endpoints
 */
const adminEndpointSecurity = [
  setSecurityHeaders,
  additionalSecurityHeaders,
  validateRequestSize(50), // 50KB max for admin operations
  validateJsonPayload,
  sanitizeInput,
  requireAdmin,
  ipAllowlist,
  adminRateLimit
];

/**
 * Complete security stack for metrics endpoints
 */
const metricsEndpointSecurity = [
  setSecurityHeaders,
  additionalSecurityHeaders,
  requireAdmin,
  metricsRateLimit
];

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Individual middlewares
  sanitizeInput,
  validateRequestSize,
  validateJsonPayload,
  setSecurityHeaders,
  additionalSecurityHeaders,
  ipAllowlist,
  requireAdmin,

  // Rate limiters
  aiMessageRateLimit,
  voiceRateLimit,
  adminRateLimit,
  metricsRateLimit,

  // Combined stacks
  aiEndpointSecurity,
  voiceEndpointSecurity,
  adminEndpointSecurity,
  metricsEndpointSecurity
};
