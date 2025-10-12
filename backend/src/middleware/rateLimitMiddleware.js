const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for platform admin routes
 * Super admins get higher limits but still rate limited for security
 */
const platformRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window (higher than normal users)
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Stricter rate limit for sensitive operations
 */
const strictPlatformRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window for sensitive operations
  message: 'Too many sensitive operations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded for sensitive operations. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

module.exports = {
  platformRateLimiter,
  strictPlatformRateLimiter
};
