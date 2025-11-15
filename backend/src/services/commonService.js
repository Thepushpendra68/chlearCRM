/**
 * Common Service
 * Shared utilities and patterns used across all services
 * Extracts duplicate code to promote DRY principle
 */

const ApiError = require('../utils/ApiError');
const { supabaseAdmin, getSupabaseForUser } = require('../config/supabase');

/**
 * Service Error Handler
 * Wraps async operations with consistent error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Service Error Handler (for class methods)
 * Wraps class methods with consistent error handling
 */
const withErrorHandling = (fn, errorMessage = 'Operation failed') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(errorMessage, 500, { originalError: error.message });
    }
  };
};

/**
 * Database Operation Wrapper
 * Provides consistent database operation patterns
 */
class DatabaseService {
  /**
   * Execute a database operation with error handling
   */
  static async execute(operation, options = {}) {
    const { errorMessage = 'Database operation failed', retryCount = 0 } = options;

    try {
      const result = await operation();
      return result;
    } catch (error) {
      console.error(`${errorMessage}:`, error);

      if (retryCount > 0) {
        console.log(`Retrying operation (${retryCount} attempts remaining)...`);
        return this.execute(operation, { ...options, retryCount: retryCount - 1 });
      }

      throw error;
    }
  }

  /**
   * Get Supabase client for user (with RLS)
   */
  static getSupabaseForUser(userId) {
    return getSupabaseForUser(userId);
  }

  /**
   * Get admin client (bypasses RLS)
   */
  static getSupabaseAdmin() {
    return supabaseAdmin;
  }

  /**
   * Safe database query with error handling
   */
  static async safeQuery(queryFn, errorMessage = 'Query failed') {
    try {
      const { data, error } = await queryFn();

      if (error) {
        console.error(`${errorMessage}:`, error);
        throw new ApiError(errorMessage, 500, { details: error.message });
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error(`${errorMessage}:`, error);
      throw new ApiError(errorMessage, 500, { originalError: error.message });
    }
  }

  /**
   * Upsert operation with error handling
   */
  static async upsert(table, data, options = {}) {
    const { onConflict, errorMessage = 'Upsert failed' } = options;

    const query = supabaseAdmin
      .from(table)
      .upsert(data, { onConflict });

    return this.safeQuery(
      () => query,
      errorMessage
    );
  }

  /**
   * Insert operation with error handling
   */
  static async insert(table, data, errorMessage = 'Insert failed') {
    const query = supabaseAdmin
      .from(table)
      .insert(data);

    return this.safeQuery(
      () => query,
      errorMessage
    );
  }

  /**
   * Update operation with error handling
   */
  static async update(table, data, filter, errorMessage = 'Update failed') {
    let query = supabaseAdmin
      .from(table)
      .update(data);

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return this.safeQuery(
      () => query,
      errorMessage
    );
  }

  /**
   * Select operation with error handling
   */
  static async select(table, columns = '*', filters = {}, errorMessage = 'Select failed') {
    let query = supabaseAdmin
      .from(table)
      .select(columns);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    return this.safeQuery(
      () => query,
      errorMessage
    );
  }

  /**
   * Delete operation with error handling
   */
  static async delete(table, filters, errorMessage = 'Delete failed') {
    let query = supabaseAdmin
      .from(table)
      .delete();

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return this.safeQuery(
      () => query,
      errorMessage
    );
  }
}

/**
 * Validation Service
 * Common validation patterns
 */
class ValidationService {
  /**
   * Validate and sanitize string input
   */
  static validateString(value, options = {}) {
    const { minLength = 0, maxLength = Infinity, required = false } = options;

    if (required && (!value || value.trim() === '')) {
      throw new ApiError('Value is required', 400);
    }

    if (value && value.length < minLength) {
      throw new ApiError(`Minimum length is ${minLength} characters`, 400);
    }

    if (value && value.length > maxLength) {
      throw new ApiError(`Maximum length is ${maxLength} characters`, 400);
    }

    return value ? value.trim() : value;
  }

  /**
   * Validate numeric value
   */
  static validateNumber(value, options = {}) {
    const { min = -Infinity, max = Infinity, required = false } = options;

    if (required && (value === undefined || value === null)) {
      throw new ApiError('Value is required', 400);
    }

    if (value !== undefined && value !== null) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        throw new ApiError('Value must be a number', 400);
      }

      if (num < min) {
        throw new ApiError(`Minimum value is ${min}`, 400);
      }

      if (num > max) {
        throw new ApiError(`Maximum value is ${max}`, 400);
      }

      return num;
    }

    return value;
  }

  /**
   * Validate UUID
   */
  static validateUUID(value, required = false) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (required && !value) {
      throw new ApiError('UUID is required', 400);
    }

    if (value && !uuidRegex.test(value)) {
      throw new ApiError('Invalid UUID format', 400);
    }

    return value;
  }

  /**
   * Validate email
   */
  static validateEmail(email, required = false) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (required && !email) {
      throw new ApiError('Email is required', 400);
    }

    if (email && !emailRegex.test(email)) {
      throw new ApiError('Invalid email format', 400);
    }

    return email;
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone, required = false) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{0,20}$/;

    if (required && !phone) {
      throw new ApiError('Phone number is required', 400);
    }

    if (phone && !phoneRegex.test(phone)) {
      throw new ApiError('Invalid phone number format', 400);
    }

    return phone;
  }

  /**
   * Validate language code
   */
  static validateLanguage(language, allowedLanguages = ['en-US', 'en-GB', 'hi-IN', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN']) {
    if (language && !allowedLanguages.includes(language)) {
      throw new ApiError(`Unsupported language. Allowed: ${allowedLanguages.join(', ')}`, 400);
    }

    return language || 'en-US';
  }

  /**
   * Validate voice settings
   */
  static validateVoiceSettings(settings) {
    const validated = {};

    // Language
    validated.language = this.validateLanguage(settings.language);

    // Rate (0.5 to 2.0)
    if (settings.rate !== undefined) {
      const rate = this.validateNumber(settings.rate, { min: 0.5, max: 2.0 });
      validated.rate = rate;
    }

    // Pitch (0.5 to 2.0)
    if (settings.pitch !== undefined) {
      const pitch = this.validateNumber(settings.pitch, { min: 0.5, max: 2.0 });
      validated.pitch = pitch;
    }

    // Volume (0.0 to 1.0)
    if (settings.volume !== undefined) {
      const volume = this.validateNumber(settings.volume, { min: 0.0, max: 1.0 });
      validated.volume = volume;
    }

    // Auto-speak
    validated.autoSpeak = !!settings.autoSpeak;

    // Voice activation
    validated.voiceActivation = !!settings.voiceActivation;

    // Wake word
    validated.wakeWord = settings.wakeWord || 'Hey Sakha';

    // Silence delay
    if (settings.silenceDelay !== undefined) {
      const delay = this.validateNumber(settings.silenceDelay, { min: 1000, max: 30000 });
      validated.silenceDelay = delay;
    }

    // Privacy settings
    if (settings.privacy) {
      validated.privacy = {};
      validated.privacy.storeVoiceNotes = !!settings.privacy.storeVoiceNotes;
      validated.privacy.allowVoiceAnalytics = !!settings.privacy.allowVoiceAnalytics;

      if (settings.privacy.dataRetentionDays !== undefined) {
        const days = this.validateNumber(settings.privacy.dataRetentionDays, { min: 1, max: 365 });
        validated.privacy.dataRetentionDays = days;
      }
    }

    return validated;
  }
}

/**
 * Logging Service
 * Consistent logging patterns
 */
class LoggingService {
  /**
   * Log service operation start
   */
  static logOperationStart(operation, context = {}) {
    console.log(`[${operation}] Starting operation`, context);
  }

  /**
   * Log service operation success
   */
  static logOperationSuccess(operation, data = {}) {
    console.log(`[${operation}] Operation completed successfully`, data);
  }

  /**
   * Log service operation error
   */
  static logOperationError(operation, error, context = {}) {
    console.error(`[${operation}] Operation failed:`, error.message, context);
  }

  /**
   * Log database operation
   */
  static logDatabaseOperation(operation, table, action) {
    console.log(`[DATABASE] ${operation}: ${table}.${action}`);
  }

  /**
   * Log API call
   */
  static logApiCall(service, endpoint, method = 'GET', duration = null) {
    const msg = `[API] ${service}.${endpoint} [${method}]`;
    console.log(duration ? `${msg} - ${duration}ms` : msg);
  }
}

/**
 * Environment Service
 * Environment variable loading and validation
 */
class EnvironmentService {
  static loadConfig() {
    return {
      // Rate limiting
      rateLimitMax: parseInt(process.env.CHATBOT_RATE_LIMIT_MAX || "30"),
      rateLimitMinTime: parseInt(process.env.CHATBOT_RATE_LIMIT_MIN_TIME || "2000"),

      // Budget limits
      monthlyBudgetLimit: parseFloat(process.env.CHATBOT_MONTHLY_BUDGET_LIMIT || "100"),
      dailyBudgetLimit: parseFloat(process.env.CHATBOT_DAILY_BUDGET_LIMIT || "5"),

      // Circuit breaker
      cbFailureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || "5"),
      cbResetTimeout: parseInt(process.env.CB_RESET_TIMEOUT || "30000"),
      cbTestTimeout: parseInt(process.env.CB_TEST_TIMEOUT || "5000"),

      // Retry configuration
      retryMaxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || "3"),
      retryInitialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || "1000"),
      retryBackoffMultiplier: parseInt(process.env.RETRY_BACKOFF_MULTIPLIER || "2"),
    };
  }

  static validateApiKey(apiKey) {
    if (!apiKey) {
      throw new ApiError('API key not configured', 500);
    }

    if (apiKey.length < 20) {
      throw new ApiError('Invalid API key format', 500);
    }

    if (!apiKey.startsWith('AIza')) {
      throw new ApiError('API key must start with AIza', 500);
    }

    return true;
  }
}

module.exports = {
  ApiError,
  asyncHandler,
  withErrorHandling,
  DatabaseService,
  ValidationService,
  LoggingService,
  EnvironmentService,
};
