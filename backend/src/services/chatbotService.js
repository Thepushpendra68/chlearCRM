const { GoogleGenerativeAI } = require("@google/generative-ai");
const leadService = require("./leadService");
const ApiError = require("../utils/ApiError");
const chatbotFallback = require("./chatbotFallback");
const { createPendingActionToken } = require("../utils/actionToken");

const VALID_ACTIONS = new Set([
  "CHAT",
  "CREATE_LEAD",
  "UPDATE_LEAD",
  "GET_LEAD",
  "SEARCH_LEADS",
  "LIST_LEADS",
  "GET_STATS",
  "DELETE_LEAD",
  "ADD_LEAD_NOTE",
  "VIEW_LEAD_NOTES",
  "MOVE_LEAD_STAGE",
  "ASSIGN_LEAD",
  "UNASSIGN_LEAD",
  "DETECT_DUPLICATES",
  "EXPORT_LEADS",
  "SUGGEST_ASSIGNMENT",
  "LEAD_SCORING",
  "CREATE_TASK",
  "LIST_MY_TASKS",
  "UPDATE_TASK",
  "GET_TASKS",
  "GET_TASK_BY_ID",
  "COMPLETE_TASK",
  "DELETE_TASK",
  "GET_OVERDUE_TASKS",
  "GET_TASK_STATS",
  "GET_TASKS_BY_LEAD_ID",
  // Email System (32 actions)
  // EmailSend (7 actions)
  "SEND_TO_LEAD",
  "SEND_TO_EMAIL",
  "GET_SENT_EMAILS",
  "GET_EMAIL_DETAILS",
  "GET_SUPPRESSION_LIST",
  "ADD_TO_SUPPRESSION_LIST",
  "REMOVE_FROM_SUPPRESSION_LIST",
  // EmailTemplate (12 actions)
  "GET_TEMPLATES",
  "GET_TEMPLATE_BY_ID",
  "CREATE_TEMPLATE",
  "UPDATE_TEMPLATE",
  "DELETE_TEMPLATE",
  "CREATE_VERSION",
  "PUBLISH_VERSION",
  "COMPILE_MJML",
  "PREVIEW_TEMPLATE",
  "GET_FOLDERS",
  "GET_INTEGRATION_SETTINGS",
  "UPSERT_INTEGRATION_SETTINGS",
  // Automation (9 actions)
  "GET_SEQUENCES",
  "GET_SEQUENCE_BY_ID",
  "CREATE_SEQUENCE",
  "UPDATE_SEQUENCE",
  "DELETE_SEQUENCE",
  "ENROLL_LEAD",
  "UNENROLL_LEAD",
  "GET_ENROLLMENTS",
  "PROCESS_DUE_ENROLLMENTS",
  // WorkflowTemplate (10 actions)
  "GET_WORKFLOW_TEMPLATES",
  "GET_WORKFLOW_TEMPLATE_BY_ID",
  "CREATE_WORKFLOW_TEMPLATE",
  "CREATE_SEQUENCE_FROM_TEMPLATE",
  "UPDATE_WORKFLOW_TEMPLATE",
  "DELETE_WORKFLOW_TEMPLATE",
  "EXPORT_WORKFLOW_TEMPLATE",
  "IMPORT_WORKFLOW_TEMPLATE",
  "GET_TEMPLATE_PACKS",
  "GET_PACK_BY_ID",
  "LOG_ACTIVITY",
  "GET_TEAM_STATS",
  "GET_MY_STATS",
  "BULK_UPDATE_LEADS",
  "BULK_ASSIGN_LEADS",
  "GROUP_BY_ANALYSIS",
  "SCHEDULE_REPORT",
  "CREATE_REMINDER",
  // Activity Module (15 actions)
  "GET_ACTIVITIES",
  "CREATE_ACTIVITY",
  "GET_ACTIVITY_STATS",
  "GET_TEAM_TIMELINE",
  "COMPLETE_ACTIVITY",
  "GET_ACTIVITY_BY_ID",
  "GET_LEAD_TIMELINE",
  "GET_LEAD_ACTIVITIES",
  "GET_USER_ACTIVITIES",
  "CREATE_BULK_ACTIVITIES",
  "UPDATE_ACTIVITY",
  "DELETE_ACTIVITY",
  "GET_LEAD_TIMELINE_SUMMARY",
  "GET_USER_TIMELINE",
  "GET_ACTIVITY_TRENDS",

  // Week 4: Final Modules (18 actions)
  // Import/Export Module (8 actions)
  "IMPORT_LEADS",
  "DRY_RUN_LEADS",
  "GET_IMPORT_HISTORY",
  "VALIDATE_IMPORT_FILE",
  "CONVERT_TO_CSV",
  "CONVERT_TO_EXCEL",
  "GET_SUGGESTED_MAPPINGS",
  "GET_UPLOAD_MIDDLEWARE",

  // Auth Module (6 actions)
  "REGISTER",
  "LOGIN",
  "GET_PROFILE",
  "UPDATE_PROFILE",
  "CHANGE_PASSWORD",
  "LOGOUT",

  // EmailWebhook Module (3 actions)
  "HANDLE_POSTMARK_WEBHOOK",
  "HANDLE_SENDGRID_WEBHOOK",
  "TEST_WEBHOOK",

  // LeadCapture Module (1 action)
  "CREATE_CAPTURE_FORM",
  // Assignment Module (10 actions)
  "GET_TEAM_WORKLOAD",
  "AUTO_ASSIGN_LEAD",
  "CREATE_ASSIGNMENT_RULE",
  "GET_ASSIGNMENT_RECOMMENDATIONS",
  "REDISTRIBUTE_LEADS",
  "REASSIGN_LEAD",
  "GET_ASSIGNMENT_STATS",
  "GET_ASSIGNMENT_HISTORY",
  "GET_ACTIVE_RULES",
  "GET_ROUTING_STATS",
  // Pipeline Module (9 actions)
  "GET_STAGES",
  "CREATE_STAGE",
  "UPDATE_STAGE",
  "DELETE_STAGE",
  "REORDER_STAGES",
  "GET_PIPELINE_OVERVIEW",
  "MOVE_LEAD_TO_STAGE",
  "GET_CONVERSION_RATES",
  "CREATE_DEFAULT_STAGES",
]);

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-pro-latest",
];

// Model cost tracking (per 1K tokens - approximate)
const MODEL_COSTS = {
  "gemini-2.0-flash-exp": { input: 0.001, output: 0.004 },
  "gemini-1.5-flash-latest": { input: 0.00035, output: 0.00105 },
  "gemini-1.5-pro-latest": { input: 0.00125, output: 0.00375 },
  "gemini-pro-latest": { input: 0.0005, output: 0.0015 },
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Requests per minute
  maxRequests: parseInt(process.env.CHATBOT_RATE_LIMIT_MAX || "30"),
  minTime: parseInt(process.env.CHATBOT_RATE_LIMIT_MIN_TIME || "2000"), // 2 seconds between requests
  // Budget limits (monthly)
  monthlyBudgetLimit: parseFloat(process.env.CHATBOT_MONTHLY_BUDGET_LIMIT || "100"), // $100
  dailyBudgetLimit: parseFloat(process.env.CHATBOT_DAILY_BUDGET_LIMIT || "5"), // $5
};

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  // Number of consecutive failures to open the circuit
  failureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || "5"),
  // Reset timeout in milliseconds (time to wait before trying again)
  resetTimeout: parseInt(process.env.CB_RESET_TIMEOUT || "30000"), // 30 seconds
  // Expected test timeout
  testTimeout: parseInt(process.env.CB_TEST_TIMEOUT || "5000"), // 5 seconds
  // Monitoring window for success rate
  monitoringPeriod: parseInt(process.env.CB_MONITORING_PERIOD || "60000"), // 1 minute
};

// Retry configuration
const RETRY_CONFIG = {
  // Max retry attempts
  maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || "3"),
  // Initial backoff delay in ms
  initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || "1000"), // 1 second
  // Max backoff delay in ms
  maxDelay: parseInt(process.env.RETRY_MAX_DELAY || "10000"), // 10 seconds
  // Backoff multiplier
  backoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || "2"),
};

/**
 * Chatbot Service for Lead Management
 * Uses Google Gemini AI to process natural language queries
 */
class ChatbotService {
  constructor() {
    this.conversationHistory = new Map(); // Store conversation context per user
    this.useFallbackOnly = process.env.CHATBOT_FALLBACK_ONLY === "true";
    this.modelCache = new Map();
    this.geminiModels = [];

    // Initialize rate limiter
    this.initializeRateLimiter();

    // Initialize budget tracking
    this.initializeBudgetTracking();

    // Initialize circuit breaker for API failures
    this.initializeCircuitBreaker();

    // Initialize monitoring and logging
    this.initializeMonitoring();

    // If fallback-only mode, skip AI initialization
    if (this.useFallbackOnly) {
      console.log("[CHATBOT] Running in FALLBACK-ONLY mode (AI disabled)");
      console.log("[CHATBOT] Pattern matching chatbot initialized");
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Log environment variable status on startup
    this.logEnvironmentStatus();

    // Validate API key format and presence
    const keyValidation = this.validateApiKey(apiKey);
    if (!keyValidation.isValid) {
      console.warn(
        `[CHATBOT] GEMINI_API_KEY validation failed: ${keyValidation.error} - will use fallback pattern matching`,
      );
      this.useFallbackOnly = true;
      return;
    }

    try {
      console.log(
        "[CHATBOT] Initializing Gemini AI with API key:",
        apiKey.substring(0, 10) + "...",
      );

      // Initialize Gemini AI
      this.genAI = new GoogleGenerativeAI(apiKey);

      const configuredModels = process.env.CHATBOT_GEMINI_MODELS
        ? process.env.CHATBOT_GEMINI_MODELS.split(",")
            .map((model) => model.trim())
            .filter(Boolean)
        : DEFAULT_GEMINI_MODELS;

      this.geminiModels =
        configuredModels.length > 0 ? configuredModels : DEFAULT_GEMINI_MODELS;

      console.log(
        "[CHATBOT] Gemini AI chatbot service initialized with model order:",
        this.geminiModels.join(", "),
      );
    } catch (error) {
      console.error("[CHATBOT] Failed to initialize Gemini AI:", error.message);
      console.log("[CHATBOT] Falling back to pattern matching mode");
      this.useFallbackOnly = true;
    }
  }

  /**
   * Get or create conversation history for a user
   */
  getConversationHistory(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    return this.conversationHistory.get(userId);
  }

  /**
   * Add message to conversation history
   */
  addToHistory(userId, role, content) {
    const history = this.getConversationHistory(userId);
    history.push({ role, content, timestamp: new Date() });

    // Keep only last 10 messages to avoid context overflow
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Clear conversation history for a user
   */
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  /**
   * Sanitize user input to prevent prompt injection attacks
   * Removes dangerous patterns that could manipulate the AI
   */
  sanitizeInput(input) {
    if (!input || typeof input !== "string") {
      return "";
    }

    let sanitized = input
      // Remove null bytes
      .replace(/\0/g, "")
      // Remove markdown code blocks that might contain malicious instructions
      .replace(/```[\s\S]*?```/g, "")
      // Remove single-line code blocks
      .replace(/`([^`]+)`/g, "$1")
      // Filter out common prompt injection patterns
      .replace(/ignore\s+previous\s+instructions/gi, "")
      .replace(/forget\s+all\s+previous\s+instructions/gi, "")
      .replace(/ignore\s+system\s+prompts/gi, "")
      .replace(/you\s+are\s+a\s+(different|new)\s+(assistant|AI|agent)/gi, "")
      .replace(/new\s+system\s+(message|prompt)/gi, "")
      .replace(/previous\s+system\s+(message|prompt)/gi, "")
      .replace(/role\s*:\s*(assistant|AI|system|developer|user)/gi, "")
      .replace(/system\s*:\s*/gi, "")
      .replace(/assistant\s*:\s*/gi, "")
      .replace(/AI\s*:\s*/gi, "")
      // Prevent template injection by replacing braces in template-like strings
      .replace(/\{\{[^}]+\}\}/g, "")
      .replace(/\{[^}]+\}/g, "")
      // Limit length to prevent excessively long inputs
      .substring(0, 2000)
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Additional check for attempts to override system prompt
    const dangerousPatterns = [
      /act\s+as\s+if\s+you\s+are\s+(?:a\s+)?different/i,
      /pretend\s+to\s+be\s+a\s+(?:different|new)\s+(?:AI|assistant)/i,
      /override\s+your\s+(?:system|programming|guidelines)/i,
      /ignore\s+all\s+(?:guidelines|rules|prompts|instructions)/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        console.warn("[CHATBOT] Potentially malicious input detected and sanitized");
        return "";
      }
    }

    return sanitized;
  }

  /**
   * Validate Gemini API key format and structure
   * @param {string} apiKey - The API key to validate
   * @returns {Object} - Validation result with isValid flag and error message
   */
  validateApiKey(apiKey) {
    // Check if API key is present
    if (!apiKey) {
      return {
        isValid: false,
        error: "API key is not set in environment variables",
      };
    }

    // Check minimum length (Gemini API keys are typically 40+ characters)
    if (apiKey.length < 20) {
      return {
        isValid: false,
        error: `API key too short (${apiKey.length} chars), expected at least 20 characters`,
      };
    }

    // Check for valid characters (should be alphanumeric with possible special chars)
    const validKeyPattern = /^[A-Za-z0-9_\-]+$/;
    if (!validKeyPattern.test(apiKey)) {
      return {
        isValid: false,
        error: "API key contains invalid characters",
      };
    }

    // Check for common invalid patterns
    if (apiKey.includes("your-api-key-here") || apiKey.includes("placeholder")) {
      return {
        isValid: false,
        error: "API key appears to be a placeholder value",
      };
    }

    // Check for potential key rotation indicators
    this.checkKeyRotationWarnings(apiKey);

    return {
      isValid: true,
      error: null,
    };
  }

  /**
   * Log environment variable status on service initialization
   */
  logEnvironmentStatus() {
    const envVars = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Not set",
      GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY
        ? process.env.GEMINI_API_KEY.length
        : 0,
      SUPABASE_URL: process.env.SUPABASE_URL ? "✓ Set" : "✗ Not set",
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
        ? "✓ Set (length: " + process.env.SUPABASE_SERVICE_KEY.length + ")"
        : "✗ Not set",
      JWT_SECRET: process.env.JWT_SECRET ? "✓ Set" : "✗ Not set",
      NODE_ENV: process.env.NODE_ENV || "development",
    };

    console.log("[CHATBOT] === Environment Status ===");
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`[CHATBOT] ${key}: ${value}`);
    });
    console.log("[CHATBOT] ===========================");

    // Log security warnings
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[CHATBOT] ⚠️ Running in DEVELOPMENT mode - DO NOT use production API keys",
      );
    }
  }

  /**
   * Check for key rotation warnings and potential issues
   * @param {string} apiKey - The API key to check
   */
  checkKeyRotationWarnings(apiKey) {
    const warnings = [];

    // Check if key might be close to expiry or recently rotated
    // (Gemini API keys don't have explicit expiry, but this helps detect issues)
    if (apiKey.length < 30) {
      warnings.push("API key is shorter than typical");
    }

    // Check for repeated characters (potential invalid key)
    const repeatedCharPattern = /(.)\1{10,}/;
    if (repeatedCharPattern.test(apiKey)) {
      warnings.push("API key has repeated character patterns");
    }

    // Log warnings
    if (warnings.length > 0) {
      console.warn("[CHATBOT] ⚠️ API Key Warnings:");
      warnings.forEach((warning) => {
        console.warn(`[CHATBOT]   - ${warning}`);
      });
    }
  }

  /**
   * Health check endpoint for API key validation
   * @returns {Object} - Health status with API key validation
   */
  async healthCheck() {
    // Reset counters if needed
    this.resetCountersIfNeeded();

    const dailyPercent = (
      (this.usageStats.dailyCost / RATE_LIMIT_CONFIG.dailyBudgetLimit) *
      100
    );
    const monthlyPercent = (
      (this.usageStats.monthlyCost / RATE_LIMIT_CONFIG.monthlyBudgetLimit) *
      100
    );

    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        ai: {
          enabled: !this.useFallbackOnly,
          models: this.useFallbackOnly ? [] : this.geminiModels,
          apiKeyStatus: this.getApiKeyStatus(),
        },
        circuitBreaker: this.getCircuitBreakerStatus(),
        errorRecovery: {
          enabled: true,
          retryConfig: RETRY_CONFIG,
          features: {
            circuitBreaker: "✓ Enabled",
            exponentialBackoff: "✓ Enabled",
            gracefulDegradation: "✓ Enabled",
            conversationRecovery: "✓ Enabled (in-memory)",
          },
        },
        rateLimiting: {
          enabled: !this.useFallbackOnly,
          maxRequests: RATE_LIMIT_CONFIG.maxRequests,
          minTime: RATE_LIMIT_CONFIG.minTime,
          reservoir: this.rateLimiter ? this.rateLimiter.opts.reservoir : 0,
        },
        budgetTracking: {
          enabled: true,
          monthly: {
            limit: RATE_LIMIT_CONFIG.monthlyBudgetLimit,
            used: this.usageStats.monthlyCost,
            percentage: monthlyPercent.toFixed(2),
            status:
              monthlyPercent >= 90
                ? "critical"
                : monthlyPercent >= 80
                ? "warning"
                : "ok",
          },
          daily: {
            limit: RATE_LIMIT_CONFIG.dailyBudgetLimit,
            used: this.usageStats.dailyCost,
            percentage: dailyPercent.toFixed(2),
            status:
              dailyPercent >= 90
                ? "critical"
                : dailyPercent >= 80
                ? "warning"
                : "ok",
          },
          total: {
            requests: this.usageStats.requests,
            cost: this.usageStats.totalCost,
          },
          byModel: this.usageStats.byModel,
        },
      },
    };

    return health;
  }

  /**
   * Get current API key status
   * @returns {Object} - API key status information
   */
  getApiKeyStatus() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        present: false,
        validated: false,
        message: "API key not set",
      };
    }

    const validation = this.validateApiKey(apiKey);
    return {
      present: true,
      validated: validation.isValid,
      length: apiKey.length,
      prefix: apiKey.substring(0, 6) + "...",
      message: validation.isValid
        ? "API key is valid"
        : `Validation failed: ${validation.error}`,
    };
  }

  /**
   * Initialize rate limiter using Bottleneck
   */
  initializeRateLimiter() {
    const Bottleneck = require("bottleneck");

    // Create rate limiter with token bucket algorithm
    this.rateLimiter = new Bottleneck({
      reservoir: RATE_LIMIT_CONFIG.maxRequests, // Initial tokens
      reservoirRefreshAmount: RATE_LIMIT_CONFIG.maxRequests, // Refill to max
      reservoirRefreshInterval: 60 * 1000, // Refill every minute
      maxConcurrent: 1, // Only 1 request at a time
      minTime: RATE_LIMIT_CONFIG.minTime, // Minimum time between requests
    });

    // Add event listeners for monitoring
    this.rateLimiter.on("error", (error) => {
      console.error("[CHATBOT] Rate limiter error:", error);
    });

    this.rateLimiter.on("depleted", () => {
      console.warn("[CHATBOT] Rate limit reservoir depleted - throttling requests");
    });

    console.log(
      `[CHATBOT] Rate limiter initialized: max ${RATE_LIMIT_CONFIG.maxRequests} requests/min`,
    );
  }

  /**
   * Initialize budget tracking
   */
  initializeBudgetTracking() {
    // Usage statistics
    this.usageStats = {
      requests: 0,
      totalCost: 0,
      dailyCost: 0,
      monthlyCost: 0,
      lastResetDate: new Date().toDateString(),
      lastResetMonth: new Date().getMonth(),
      byModel: {}, // Track usage per model
    };

    // Check for existing stats in storage (could be database in production)
    this.loadUsageStats();

    console.log("[CHATBOT] Budget tracking initialized:");
    console.log(`  Monthly budget limit: $${RATE_LIMIT_CONFIG.monthlyBudgetLimit}`);
    console.log(`  Daily budget limit: $${RATE_LIMIT_CONFIG.dailyBudgetLimit}`);
  }

  /**
   * Load usage statistics from storage
   */
  loadUsageStats() {
    // In production, this would load from database
    // For now, we keep in memory
    console.log("[CHATBOT] Usage stats loaded from memory");
  }

  /**
   * Save usage statistics to storage
   */
  saveUsageStats() {
    // In production, this would save to database
    console.log("[CHATBOT] Usage stats saved (in-memory)");
  }

  /**
   * Check if rate limit allows the request
   * @returns {Promise<boolean>} - Whether the request is allowed
   */
  async checkRateLimit() {
    try {
      await this.rateLimiter.schedule(() => Promise.resolve());
      return {
        allowed: true,
        remaining: this.rateLimiter.opts.reservoir,
      };
    } catch (error) {
      if (error.name === "BottleneckError") {
        return {
          allowed: false,
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: this.rateLimiter.opts.minTime,
        };
      }
      throw error;
    }
  }

  /**
   * Check if budget allows the request
   * @param {string} modelName - The model that would be used
   * @param {number} estimatedInputTokens - Estimated input tokens
   * @param {number} estimatedOutputTokens - Estimated output tokens
   * @returns {Object} - Budget check result
   */
  checkBudget(modelName, estimatedInputTokens = 1000, estimatedOutputTokens = 500) {
    // Reset daily/monthly counters if needed
    this.resetCountersIfNeeded();

    // Calculate estimated cost
    const modelCosts = MODEL_COSTS[modelName] || MODEL_COSTS["gemini-1.5-flash-latest"];
    const estimatedCost =
      (estimatedInputTokens / 1000) * modelCosts.input +
      (estimatedOutputTokens / 1000) * modelCosts.output;

    // Check daily budget
    if (this.usageStats.dailyCost + estimatedCost > RATE_LIMIT_CONFIG.dailyBudgetLimit) {
      return {
        allowed: false,
        reason: "daily_budget_exceeded",
        currentDailyCost: this.usageStats.dailyCost,
        dailyLimit: RATE_LIMIT_CONFIG.dailyBudgetLimit,
        estimatedCost,
      };
    }

    // Check monthly budget
    if (this.usageStats.monthlyCost + estimatedCost > RATE_LIMIT_CONFIG.monthlyBudgetLimit) {
      return {
        allowed: false,
        reason: "monthly_budget_exceeded",
        currentMonthlyCost: this.usageStats.monthlyCost,
        monthlyLimit: RATE_LIMIT_CONFIG.monthlyBudgetLimit,
        estimatedCost,
      };
    }

    return {
      allowed: true,
      estimatedCost,
    };
  }

  /**
   * Record API usage and update statistics
   * @param {string} modelName - Model used
   * @param {number} inputTokens - Input tokens consumed
   * @param {number} outputTokens - Output tokens consumed
   * @param {number} cost - Actual cost
   */
  recordUsage(modelName, inputTokens, outputTokens, cost) {
    this.usageStats.requests += 1;
    this.usageStats.totalCost += cost;
    this.usageStats.dailyCost += cost;
    this.usageStats.monthlyCost += cost;

    // Track per-model usage
    if (!this.usageStats.byModel[modelName]) {
      this.usageStats.byModel[modelName] = {
        requests: 0,
        tokens: { input: 0, output: 0 },
        cost: 0,
      };
    }

    this.usageStats.byModel[modelName].requests += 1;
    this.usageStats.byModel[modelName].tokens.input += inputTokens;
    this.usageStats.byModel[modelName].tokens.output += outputTokens;
    this.usageStats.byModel[modelName].cost += cost;

    // Log usage statistics periodically
    if (this.usageStats.requests % 10 === 0) {
      this.logUsageStatistics();
    }

    // Save stats periodically
    if (this.usageStats.requests % 50 === 0) {
      this.saveUsageStats();
    }

    // Check for budget alerts
    this.checkBudgetAlerts();

    // Update AI metrics for monitoring
    this.updateAIMetrics(modelName, { inputTokens, outputTokens }, cost);

    // Log structured AI usage event
    this.createLogEntry("INFO", "ai_usage_recorded", {
      modelName,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      totalRequests: this.usageStats.requests,
      totalCost: this.usageStats.totalCost,
    });
  }

  /**
   * Log usage statistics
   */
  logUsageStatistics() {
    const dailyPercent = (
      (this.usageStats.dailyCost / RATE_LIMIT_CONFIG.dailyBudgetLimit) *
      100
    ).toFixed(1);
    const monthlyPercent = (
      (this.usageStats.monthlyCost / RATE_LIMIT_CONFIG.monthlyBudgetLimit) *
      100
    ).toFixed(1);

    console.log("[CHATBOT] === Usage Statistics ===");
    console.log(`[CHATBOT] Total requests: ${this.usageStats.requests}`);
    console.log(`[CHATBOT] Total cost: $${this.usageStats.totalCost.toFixed(4)}`);
    console.log(`[CHATBOT] Daily cost: $${this.usageStats.dailyCost.toFixed(4)} / $${RATE_LIMIT_CONFIG.dailyBudgetLimit} (${dailyPercent}%)`);
    console.log(`[CHATBOT] Monthly cost: $${this.usageStats.monthlyCost.toFixed(4)} / $${RATE_LIMIT_CONFIG.monthlyBudgetLimit} (${monthlyPercent}%)`);
    console.log("[CHATBOT] By model:");
    Object.entries(this.usageStats.byModel).forEach(([model, stats]) => {
      console.log(`[CHATBOT]   ${model}: ${stats.requests} req, $${stats.cost.toFixed(4)}`);
    });
    console.log("[CHATBOT] ========================");
  }

  /**
   * Check for budget alerts
   */
  checkBudgetAlerts() {
    const dailyPercent = (this.usageStats.dailyCost / RATE_LIMIT_CONFIG.dailyBudgetLimit) * 100;
    const monthlyPercent = (this.usageStats.monthlyCost / RATE_LIMIT_CONFIG.monthlyBudgetLimit) * 100;

    // Alert at 80% threshold
    if (dailyPercent >= 80 && dailyPercent < 90) {
      console.warn(`[CHATBOT] ⚠️ Daily budget at ${dailyPercent.toFixed(1)}% (${
        this.usageStats.dailyCost.toFixed(2)
      } / $${RATE_LIMIT_CONFIG.dailyBudgetLimit})`);
    } else if (dailyPercent >= 90) {
      console.error(`[CHATBOT] 🚨 Daily budget at ${dailyPercent.toFixed(1)}% - CRITICAL!`);
    }

    if (monthlyPercent >= 80 && monthlyPercent < 90) {
      console.warn(`[CHATBOT] ⚠️ Monthly budget at ${monthlyPercent.toFixed(1)}% (${
        this.usageStats.monthlyCost.toFixed(2)
      } / $${RATE_LIMIT_CONFIG.monthlyBudgetLimit})`);
    } else if (monthlyPercent >= 90) {
      console.error(`[CHATBOT] 🚨 Monthly budget at ${monthlyPercent.toFixed(1)}% - CRITICAL!`);
    }
  }

  /**
   * Reset daily/monthly counters if needed
   */
  resetCountersIfNeeded() {
    const now = new Date();
    const today = now.toDateString();
    const thisMonth = now.getMonth();

    // Reset daily counter
    if (this.usageStats.lastResetDate !== today) {
      console.log("[CHATBOT] Resetting daily usage statistics");
      this.usageStats.dailyCost = 0;
      this.usageStats.lastResetDate = today;
    }

    // Reset monthly counter
    if (this.usageStats.lastResetMonth !== thisMonth) {
      console.log("[CHATBOT] Resetting monthly usage statistics");
      this.usageStats.monthlyCost = 0;
      this.usageStats.lastResetMonth = thisMonth;
    }
  }

  /**
   * Initialize circuit breaker for API failures
   */
  initializeCircuitBreaker() {
    this.circuitBreaker = {
      // States: CLOSED, OPEN, HALF_OPEN
      state: "CLOSED",
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      nextAttempt: null,
      // Track request history for success rate calculation
      requestHistory: [],
      // Options
      options: CIRCUIT_BREAKER_CONFIG,
    };

    console.log("[CHATBOT] Circuit breaker initialized:");
    console.log(`  Failure threshold: ${CIRCUIT_BREAKER_CONFIG.failureThreshold} consecutive failures`);
    console.log(`  Reset timeout: ${CIRCUIT_BREAKER_CONFIG.resetTimeout / 1000}s`);
    console.log(`  State: CLOSED`);
  }

  /**
   * Check if circuit breaker allows request
   * @returns {Object} - Object with { allowed: boolean, state: string }
   */
  checkCircuitBreaker() {
    const now = Date.now();

    // If circuit is OPEN, check if we should try again
    if (this.circuitBreaker.state === "OPEN") {
      if (now < this.circuitBreaker.nextAttempt) {
        return {
          allowed: false,
          state: "OPEN",
          reason: "Circuit breaker is OPEN - too many failures",
          retryAfter: Math.ceil((this.circuitBreaker.nextAttempt - now) / 1000),
        };
      } else {
        // Transition to HALF_OPEN state
        this.circuitBreaker.state = "HALF_OPEN";
        this.circuitBreaker.successCount = 0;
        console.log("[CHATBOT] Circuit breaker transitioning to HALF_OPEN state");
        return {
          allowed: true,
          state: "HALF_OPEN",
          reason: "Testing if service has recovered",
        };
      }
    }

    // CLOSED or HALF_OPEN - allow request
    return {
      allowed: true,
      state: this.circuitBreaker.state,
    };
  }

  /**
   * Record success for circuit breaker
   */
  recordCircuitBreakerSuccess() {
    // Add to request history
    this.circuitBreaker.requestHistory.push({
      timestamp: Date.now(),
      success: true,
    });

    // Clean old history (older than monitoring period)
    const cutoff = Date.now() - CIRCUIT_BREAKER_CONFIG.monitoringPeriod;
    this.circuitBreaker.requestHistory = this.circuitBreaker.requestHistory.filter(
      (req) => req.timestamp > cutoff,
    );

    if (this.circuitBreaker.state === "HALF_OPEN") {
      this.circuitBreaker.successCount++;
      // If we've had successful requests in HALF_OPEN, close the circuit
      if (this.circuitBreaker.successCount >= 2) {
        const oldState = this.circuitBreaker.state;
        this.circuitBreaker.state = "CLOSED";
        this.circuitBreaker.failureCount = 0;

        // Log state change to CLOSED
        this.logCircuitBreakerStateChange(oldState, "CLOSED", "Successful recovery");
        console.log("[CHATBOT] Circuit breaker recovered - transitioning to CLOSED state");
      }
    } else if (this.circuitBreaker.state === "CLOSED") {
      this.circuitBreaker.failureCount = 0;
    }
  }

  /**
   * Record failure for circuit breaker
   */
  recordCircuitBreakerFailure() {
    // Add to request history
    this.circuitBreaker.requestHistory.push({
      timestamp: Date.now(),
      success: false,
    });

    // Clean old history
    const cutoff = Date.now() - CIRCUIT_BREAKER_CONFIG.monitoringPeriod;
    this.circuitBreaker.requestHistory = this.circuitBreaker.requestHistory.filter(
      (req) => req.timestamp > cutoff,
    );

    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();

    // Calculate success rate in the monitoring window
    const recentRequests = this.circuitBreaker.requestHistory.length;
    const recentFailures = this.circuitBreaker.requestHistory.filter((r) => !r.success).length;
    const successRate = recentRequests > 0 ? (recentRequests - recentFailures) / recentRequests : 1;

    if (this.circuitBreaker.state === "HALF_OPEN") {
      // Any failure in HALF_OPEN opens the circuit again
      this.openCircuit("Failed during HALF_OPEN recovery test");
    } else if (
      this.circuitBreaker.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold ||
      successRate < 0.5
    ) {
      // Open circuit if too many failures or success rate drops below 50%
      this.openCircuit(
        `Too many failures (${this.circuitBreaker.failureCount}) or low success rate (${(successRate * 100).toFixed(1)}%)`,
      );
    }
  }

  /**
   * Open the circuit breaker
   * @param {string} reason - Reason for opening
   */
  openCircuit(reason) {
    const oldState = this.circuitBreaker.state;
    this.circuitBreaker.state = "OPEN";
    this.circuitBreaker.nextAttempt = Date.now() + CIRCUIT_BREAKER_CONFIG.resetTimeout;

    // Log circuit breaker state change
    this.logCircuitBreakerStateChange(oldState, "OPEN", reason);

    console.error(`[CHATBOT] 🚨 Circuit breaker OPENED: ${reason}`);
    console.error(
      `[CHATBOT] Will retry after ${CIRCUIT_BREAKER_CONFIG.resetTimeout / 1000}s`,
    );
  }

  /**
   * Get circuit breaker status
   * @returns {Object} - Circuit breaker status
   */
  getCircuitBreakerStatus() {
    const recentRequests = this.circuitBreaker.requestHistory.length;
    const recentFailures = this.circuitBreaker.requestHistory.filter((r) => !r.success).length;
    const recentSuccesses = recentRequests - recentFailures;
    const successRate =
      recentRequests > 0 ? ((recentSuccesses / recentRequests) * 100).toFixed(1) : "100.0";

    return {
      state: this.circuitBreaker.state,
      failureCount: this.circuitBreaker.failureCount,
      successCount: this.circuitBreaker.successCount,
      lastFailureTime: this.circuitBreaker.lastFailureTime
        ? new Date(this.circuitBreaker.lastFailureTime).toISOString()
        : null,
      nextAttempt: this.circuitBreaker.nextAttempt
        ? new Date(this.circuitBreaker.nextAttempt).toISOString()
        : null,
      recentStats: {
        requests: recentRequests,
        successes: recentSuccesses,
        failures: recentFailures,
        successRate: `${successRate}%`,
      },
      config: this.circuitBreaker.options,
    };
  }

  /**
   * Execute with retry logic and exponential backoff
   * @param {Function} operation - Async operation to execute
   * @param {Object} options - Retry options
   * @returns {Promise} - Operation result
   */
  async executeWithRetry(operation, options = {}) {
    const maxAttempts = options.maxAttempts || RETRY_CONFIG.maxAttempts;
    const initialDelay = options.initialDelay || RETRY_CONFIG.initialDelay;
    const maxDelay = options.maxDelay || RETRY_CONFIG.maxDelay;
    const backoffMultiplier = options.backoffMultiplier || RETRY_CONFIG.backoffMultiplier;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        return { success: true, result, attempts: attempt };
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (
          error.code === 400 ||
          error.code === 401 ||
          error.code === 403 ||
          error.code === 429
        ) {
          throw error;
        }

        // If it's the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const baseDelay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay,
        );
        const jitter = baseDelay * 0.1 * Math.random(); // Add 10% jitter
        const delay = baseDelay + jitter;

        console.warn(
          `[CHATBOT] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay.toFixed(0)}ms...`,
        );
        console.warn(`[CHATBOT] Error: ${error.message}`);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Graceful degradation when AI is unavailable
   * @param {string} userMessage - Original user message
   * @param {string} reason - Reason for degradation
   * @returns {Object} - Fallback response
   */
  gracefulDegradation(userMessage, reason) {
    console.warn(`[CHATBOT] Graceful degradation activated: ${reason}`);

    // Attempt to use pattern matching fallback
    try {
      const fallbackResponse = this.buildFallbackResponse(
        userMessage,
        `degradation_${reason.replace(/\s+/g, "_")}`,
      );

      return {
        response:
          fallbackResponse.payload.response ||
          "I'm experiencing technical difficulties. I've used a simplified response mode to help you.",
        fallback: true,
        degradationReason: reason,
        canAssistWith: [
          "Basic lead information",
          "Simple lead searches",
          "Common CRM tasks",
        ],
        contactForHelp: true,
        suggestedActions: [
          "Try rephrasing your question",
          "Check your internet connection",
          "Contact support if the issue persists",
        ],
      };
    } catch (error) {
      // If even fallback fails, return basic response
      return {
        response:
          "I'm temporarily unable to process your request due to technical issues. Please try again in a moment.",
        fallback: true,
        degradationReason: reason,
        error: error.message,
        contactForHelp: true,
      };
    }
  }

  /**
   * Store conversation state for recovery
   * @param {string} userId - User ID
   * @param {Object} conversation - Conversation data to store
   * @returns {Promise} - Storage operation
   */
  async storeConversationState(userId, conversation) {
    try {
      // In production, this would save to a database
      // For now, we'll use memory storage
      if (!this.conversationRecoveryStore) {
        this.conversationRecoveryStore = new Map();
      }

      this.conversationRecoveryStore.set(userId, {
        ...conversation,
        timestamp: Date.now(),
        saved: true,
      });

      console.log(`[CHATBOT] Conversation state saved for user ${userId}`);

      // In production, also save to persistent storage
      // await this.saveToDatabase(userId, conversation);

      return { success: true, userId };
    } catch (error) {
      console.error("[CHATBOT] Failed to store conversation state:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve conversation state for recovery
   * @param {string} userId - User ID
   * @returns {Promise} - Retrieved conversation
   */
  async retrieveConversationState(userId) {
    try {
      // First try memory storage
      if (this.conversationRecoveryStore && this.conversationRecoveryStore.has(userId)) {
        const conversation = this.conversationRecoveryStore.get(userId);
        console.log(`[CHATBOT] Conversation state retrieved from memory for user ${userId}`);
        return { success: true, conversation, source: "memory" };
      }

      // In production, try database storage
      // const conversation = await this.loadFromDatabase(userId);
      // if (conversation) {
      //   return { success: true, conversation, source: "database" };
      // }

      return { success: false, reason: "No saved conversation found" };
    } catch (error) {
      console.error("[CHATBOT] Failed to retrieve conversation state:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear stored conversation state
   * @param {string} userId - User ID
   */
  clearConversationState(userId) {
    if (this.conversationRecoveryStore && this.conversationRecoveryStore.has(userId)) {
      this.conversationRecoveryStore.delete(userId);
      console.log(`[CHATBOT] Conversation state cleared for user ${userId}`);
    }
  }

  /**
   * Initialize monitoring and logging
   */
  initializeMonitoring() {
    // Performance metrics tracking
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        degraded: 0,
      },
      responseTimes: {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        min: Infinity,
        max: 0,
        samples: [],
      },
      errors: {
        byType: {},
        byMessage: {},
      },
      ai: {
        totalTokens: 0,
        totalCost: 0,
        byModel: {},
      },
      circuitBreaker: {
        stateChanges: [],
        lastStateChange: null,
      },
      // Structured log entries
      logs: [],
      // Alert thresholds
      alerts: {
        responseTimeP95: parseInt(process.env.MONITOR_ALERT_RESPONSE_TIME_P95 || "5000"), // 5s
        errorRate: parseFloat(process.env.MONITOR_ALERT_ERROR_RATE || "0.1"), // 10%
        circuitBreakerState: process.env.MONITOR_ALERT_CB_STATE || "OPEN",
      },
    };

    // Log rotation setup
    this.maxLogEntries = parseInt(process.env.MONITOR_MAX_LOG_ENTRIES || "1000");

    console.log("[CHATBOT] Monitoring initialized:");
    console.log(`  Max log entries: ${this.maxLogEntries}`);
    console.log(`  P95 response time alert: ${this.metrics.alerts.responseTimeP95}ms`);
    console.log(`  Error rate alert: ${(this.metrics.alerts.errorRate * 100)}%`);
  }

  /**
   * Create structured log entry
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
   * @param {string} event - Event name
   * @param {Object} data - Additional data
   * @returns {Object} - Structured log entry
   */
  createLogEntry(level, event, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      service: "chatbot",
      ...data,
      // Add correlation ID for tracking requests across services
      correlationId: data.correlationId || this.generateCorrelationId(),
    };

    // Store in memory for now (in production, send to ELK, Datadog, etc.)
    this.metrics.logs.push(logEntry);

    // Rotate logs if exceeding max
    if (this.metrics.logs.length > this.maxLogEntries) {
      this.metrics.logs = this.metrics.logs.slice(-this.maxLogEntries / 2);
    }

    // Output to console in JSON format for easy parsing
    console.log(JSON.stringify({ chatbot: logEntry }));

    return logEntry;
  }

  /**
   * Generate unique correlation ID
   * @returns {string} - Correlation ID
   */
  generateCorrelationId() {
    return `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log AI request start
   * @param {string} userId - User ID
   * @param {string} message - User message
   * @param {Object} options - Request options
   * @returns {string} - Correlation ID
   */
  logAIRequestStart(userId, message, options = {}) {
    const correlationId = this.generateCorrelationId();

    this.createLogEntry("INFO", "ai_request_start", {
      userId,
      messageLength: message.length,
      model: options.model,
      estimatedTokens: options.estimatedTokens,
      correlationId,
    });

    // Track request metrics
    this.metrics.requests.total++;

    return correlationId;
  }

  /**
   * Log AI request completion
   * @param {Object} result - Request result
   * @param {string} correlationId - Correlation ID from request
   */
  logAIRequestComplete(result, correlationId) {
    const duration = Date.now() - result.startTime;
    const isError = result.error !== undefined;

    this.createLogEntry(
      isError ? "ERROR" : "INFO",
      "ai_request_complete",
      {
        correlationId,
        duration,
        success: !isError,
        error: result.error,
        model: result.model,
        tokens: result.usage,
        cost: result.cost,
      },
    );

    // Update response time metrics
    this.updateResponseTimeMetrics(duration);

    // Update success/failure metrics
    if (isError) {
      this.metrics.requests.failed++;
      this.updateErrorMetrics(result.error);
    } else {
      this.metrics.requests.successful++;
    }

    // Check for alerts
    this.checkAlertThresholds();
  }

  /**
   * Update response time metrics
   * @param {number} duration - Response time in ms
   */
  updateResponseTimeMetrics(duration) {
    const samples = this.metrics.responseTimes.samples;

    // Add new sample
    samples.push(duration);

    // Keep only recent samples (last 100 requests)
    if (samples.length > 100) {
      samples.shift();
    }

    // Calculate percentiles
    samples.sort((a, b) => a - b);
    const p50Index = Math.floor(samples.length * 0.5);
    const p95Index = Math.floor(samples.length * 0.95);
    const p99Index = Math.floor(samples.length * 0.99);

    this.metrics.responseTimes.p50 = samples[p50Index] || 0;
    this.metrics.responseTimes.p95 = samples[p95Index] || 0;
    this.metrics.responseTimes.p99 = samples[p99Index] || 0;
    this.metrics.responseTimes.min = samples[0] || 0;
    this.metrics.responseTimes.max = samples[samples.length - 1] || 0;

    // Calculate average
    const sum = samples.reduce((a, b) => a + b, 0);
    this.metrics.responseTimes.average = samples.length > 0 ? sum / samples.length : 0;
  }

  /**
   * Update error metrics
   * @param {Error} error - Error object
   */
  updateErrorMetrics(error) {
    if (!error) return;

    const errorType = error.name || error.constructor.name;
    const errorMessage = error.message || "Unknown error";

    // Count by type
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;

    // Count by message (truncated)
    const shortMessage = errorMessage.substring(0, 100);
    this.metrics.errors.byMessage[shortMessage] = (this.metrics.errors.byMessage[shortMessage] || 0) + 1;
  }

  /**
   * Update AI metrics (tokens, cost, model usage)
   * @param {string} model - Model name
   * @param {Object} usage - Token usage
   * @param {number} cost - Cost
   */
  updateAIMetrics(model, usage, cost) {
    const inputTokens = usage?.inputTokens || 0;
    const outputTokens = usage?.outputTokens || 0;

    this.metrics.ai.totalTokens += inputTokens + outputTokens;
    this.metrics.ai.totalCost += cost || 0;

    if (!this.metrics.ai.byModel[model]) {
      this.metrics.ai.byModel[model] = {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
      };
    }

    const modelStats = this.metrics.ai.byModel[model];
    modelStats.requests++;
    modelStats.inputTokens += inputTokens;
    modelStats.outputTokens += outputTokens;
    modelStats.totalTokens += inputTokens + outputTokens;
    modelStats.totalCost += cost || 0;
  }

  /**
   * Log circuit breaker state change
   * @param {string} oldState - Previous state
   * @param {string} newState - New state
   * @param {string} reason - Reason for change
   */
  logCircuitBreakerStateChange(oldState, newState, reason) {
    const stateChange = {
      timestamp: new Date().toISOString(),
      from: oldState,
      to: newState,
      reason,
    };

    this.metrics.circuitBreaker.stateChanges.push(stateChange);
    this.metrics.circuitBreaker.lastStateChange = stateChange;

    // Keep only last 50 state changes
    if (this.metrics.circuitBreaker.stateChanges.length > 50) {
      this.metrics.circuitBreaker.stateChanges.shift();
    }

    this.createLogEntry("WARN", "circuit_breaker_state_change", stateChange);

    // Alert if circuit breaker opens
    if (newState === "OPEN") {
      this.createLogEntry("ERROR", "circuit_breaker_opened", {
        previousState: oldState,
        reason,
        alert: true,
      });
    }
  }

  /**
   * Check alert thresholds
   */
  checkAlertThresholds() {
    // Check error rate
    const totalRequests = this.metrics.requests.total;
    if (totalRequests > 10) {
      const errorRate = this.metrics.requests.failed / totalRequests;
      if (errorRate > this.metrics.alerts.errorRate) {
        this.createLogEntry("ERROR", "high_error_rate", {
          errorRate,
          threshold: this.metrics.alerts.errorRate,
          totalRequests,
          failedRequests: this.metrics.requests.failed,
          alert: true,
        });
      }
    }

    // Check P95 response time
    const p95 = this.metrics.responseTimes.p95;
    if (p95 > this.metrics.alerts.responseTimeP95) {
      this.createLogEntry("WARN", "high_response_time", {
        p95ResponseTime: p95,
        threshold: this.metrics.alerts.responseTimeP95,
        alert: true,
      });
    }
  }

  /**
   * Get monitoring metrics
   * @returns {Object} - Current metrics
   */
  getMetrics() {
    // Calculate current error rate
    const totalRequests = this.metrics.requests.total;
    const errorRate =
      totalRequests > 0 ? (this.metrics.requests.failed / totalRequests).toFixed(4) : "0.0000";

    return {
      timestamp: new Date().toISOString(),
      requests: {
        ...this.metrics.requests,
        errorRate,
      },
      responseTimes: {
        ...this.metrics.responseTimes,
        samplesCount: this.metrics.responseTimes.samples.length,
      },
      errors: this.metrics.errors,
      ai: this.metrics.ai,
      circuitBreaker: {
        currentState: this.circuitBreaker?.state || "UNKNOWN",
        lastStateChange: this.metrics.circuitBreaker.lastStateChange,
        recentStateChanges: this.metrics.circuitBreaker.stateChanges.slice(-5),
      },
      alerts: {
        thresholds: this.metrics.alerts,
        activeAlerts: this.metrics.logs.filter(
          (log) => log.alert === true && Date.now() - new Date(log.timestamp).getTime() < 300000,
        ).length,
      },
    };
  }

  /**
   * Export logs in JSON format
   * @param {Object} filters - Optional filters (level, event, since)
   * @returns {Array} - Filtered log entries
   */
  exportLogs(filters = {}) {
    let logs = this.metrics.logs;

    if (filters.level) {
      logs = logs.filter((log) => log.level === filters.level);
    }

    if (filters.event) {
      logs = logs.filter((log) => log.event === filters.event);
    }

    if (filters.since) {
      const sinceTime = new Date(filters.since).getTime();
      logs = logs.filter((log) => new Date(log.timestamp).getTime() >= sinceTime);
    }

    if (filters.limit) {
      logs = logs.slice(-filters.limit);
    }

    return logs;
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics() {
    const currentState = this.circuitBreaker?.state;
    const lastStateChange = this.metrics.circuitBreaker.lastStateChange;

    this.metrics.requests = {
      total: 0,
      successful: 0,
      failed: 0,
      degraded: 0,
    };

    this.metrics.responseTimes = {
      average: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      min: Infinity,
      max: 0,
      samples: [],
    };

    this.metrics.errors = {
      byType: {},
      byMessage: {},
    };

    this.metrics.ai = {
      totalTokens: 0,
      totalCost: 0,
      byModel: {},
    };

    // Keep circuit breaker state changes
    this.metrics.circuitBreaker.lastStateChange = lastStateChange;

    console.log("[CHATBOT] Metrics reset");
    if (currentState) {
      console.log(`[CHATBOT] Circuit breaker state: ${currentState}`);
    }
  }

  /**
   * Build system prompt with lead management context
   */
  getSystemPrompt() {
    return `You are an AI assistant for a CRM system. Your role is to help users manage leads through natural conversation.

**Available Actions:**
1. CREATE_LEAD - Create a new lead with details
2. UPDATE_LEAD - Update an existing lead
3. GET_LEAD - Get details of a specific lead
4. SEARCH_LEADS - Search for leads by name, email, company
5. LIST_LEADS - List leads with filters (status, source)
6. GET_STATS - Show lead statistics
7. DELETE_LEAD - Delete a lead (requires confirmation)
8. ADD_LEAD_NOTE - Add or update notes for a lead
9. VIEW_LEAD_NOTES - Get notes/activities for a lead
10. MOVE_LEAD_STAGE - Move lead to different pipeline stage
11. ASSIGN_LEAD - Assign lead to a team member
12. UNASSIGN_LEAD - Remove assignment from a lead
13. DETECT_DUPLICATES - Find duplicate leads by email, phone, or company
14. EXPORT_LEADS - Export leads to CSV file
15. SUGGEST_ASSIGNMENT - Get assignment suggestions for a lead
16. LEAD_SCORING - Score leads by engagement and potential
17. CREATE_TASK - Create new task or follow-up
18. LIST_MY_TASKS - Show my tasks with filters (overdue, completed, etc)
19. UPDATE_TASK - Mark task complete or change priority
20. LOG_ACTIVITY - Record call, email, meeting with details
21. GET_TEAM_STATS - Show team member performance metrics
22. GET_MY_STATS - Show my personal performance metrics
23. BULK_UPDATE_LEADS - Update multiple leads at once with preview
24. BULK_ASSIGN_LEADS - Assign multiple leads to team member with distribution
25. GROUP_BY_ANALYSIS - Aggregate leads by source, status, company
26. SCHEDULE_REPORT - Schedule automated reports (daily, weekly)
27. CREATE_REMINDER - Set reminders for follow-ups and tasks
28. GET_ACTIVITIES - List and filter user activities
29. CREATE_ACTIVITY - Log a call, email, or meeting activity
30. GET_ACTIVITY_STATS - Show activity statistics and trends
31. GET_TEAM_TIMELINE - Display team activity timeline
32. COMPLETE_ACTIVITY - Mark activity as completed

**Lead Fields:**
- first_name, last_name (required for creation)
- email (required, unique)
- phone
- company
- job_title (title)
- lead_source (source): website, referral, social_media, cold_call, event, other
- status: active, inactive, new, contacted, qualified, proposal, negotiation, won, lost
- deal_value (number)
- expected_close_date (YYYY-MM-DD)
- priority: low, medium, high
- notes

**Date/Value Range Filtering:**
- Natural language dates: "last week", "last 30 days", "this month", "last quarter", "since [date]", "between [date1] and [date2]"
- Value ranges: "over $50k", "between $10k and $100k", "under $25k", "above $5000"
- Examples: "Show leads created last week", "Leads with deal value over $50000", "Leads from website created this month"

**IMPORTANT: When user asks for leads with a specific status:**
- If they ask for "qualified leads" but no qualified leads exist, suggest checking "active" leads instead
- Always execute the query first, then provide helpful suggestions if no results found

**Response Format:**
You must respond in JSON format with this structure:
{
  "action": "ACTION_TYPE" or "CHAT",
  "intent": "brief description of what user wants",
  "parameters": {
    // extracted parameters based on action
  },
  "response": "conversational response to user",
  "needsConfirmation": true/false,
  "missingFields": ["field1", "field2"] // if any required fields are missing
}

**Examples:**

User: "Create a new lead named John Doe from Acme Corp, email john@acme.com"
Response:
{
  "action": "CREATE_LEAD",
  "intent": "Create new lead",
  "parameters": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Corp",
    "email": "john@acme.com"
  },
  "response": "I'll create a new lead for John Doe from Acme Corp with email john@acme.com. Would you like to add any additional details like phone number or job title?",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Show me all qualified leads"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List leads with status filter",
  "parameters": {
    "status": "qualified",
    "limit": 50
  },
  "response": "Let me fetch all qualified leads for you.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show me all leads"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List all leads",
  "parameters": {
    "limit": 50
  },
  "response": "Here are all your leads:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show leads created last week"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List leads created in date range",
  "parameters": {
    "limit": 50,
    "created_after": "2024-12-16",
    "created_before": "2024-12-23"
  },
  "response": "Here are leads created last week:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show leads with deal value over 50000"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List leads filtered by deal value",
  "parameters": {
    "limit": 50,
    "deal_value_min": 50000
  },
  "response": "Here are leads with deal value over $50,000:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "What's the email of John Doe?"
Response:
{
  "action": "SEARCH_LEADS",
  "intent": "Find lead by name",
  "parameters": {
    "search": "John Doe"
  },
  "response": "Let me search for John Doe in the system.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Delete lead john@acme.com"
Response:
{
  "action": "DELETE_LEAD",
  "intent": "Delete lead",
  "parameters": {
    "email": "john@acme.com"
  },
  "response": "I'll delete the lead for john@acme.com. This action cannot be undone. Are you sure?",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Add note to John Doe: Called today, very interested"
Response:
{
  "action": "ADD_LEAD_NOTE",
  "intent": "Add note to lead",
  "parameters": {
    "search": "John Doe",
    "note_content": "Called today, very interested"
  },
  "response": "I'll add that note to John Doe's lead. Let me save that for you.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Move John Doe to proposal stage"
Response:
{
  "action": "MOVE_LEAD_STAGE",
  "intent": "Move lead to pipeline stage",
  "parameters": {
    "search": "John Doe",
    "stage_name": "proposal"
  },
  "response": "I'll move John Doe to the proposal stage.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Assign john@acme.com to Sarah"
Response:
{
  "action": "ASSIGN_LEAD",
  "intent": "Assign lead to user",
  "parameters": {
    "email": "john@acme.com",
    "assigned_to": "Sarah"
  },
  "response": "I'll assign john@acme.com to Sarah.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Check for duplicate john@acme.com"
Response:
{
  "action": "DETECT_DUPLICATES",
  "intent": "Detect duplicate leads",
  "parameters": {
    "email": "john@acme.com"
  },
  "response": "I'll check for duplicates matching john@acme.com.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Export all qualified leads to CSV"
Response:
{
  "action": "EXPORT_LEADS",
  "intent": "Export leads to CSV",
  "parameters": {
    "status": "qualified",
    "format": "csv"
  },
  "response": "I'll export all qualified leads to CSV for you.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Who should I assign john@acme.com to?"
Response:
{
  "action": "SUGGEST_ASSIGNMENT",
  "intent": "Suggest assignment",
  "parameters": {
    "email": "john@acme.com"
  },
  "response": "Let me check assignment rules and team capacity to suggest the best person for this lead.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Score all qualified leads"
Response:
{
  "action": "LEAD_SCORING",
  "intent": "Score leads",
  "parameters": {
    "status": "qualified"
  },
  "response": "I'll score qualified leads based on engagement and potential.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Create task: Follow up with John Doe tomorrow at 2pm"
Response:
{
  "action": "CREATE_TASK",
  "intent": "Create task",
  "parameters": {
    "description": "Follow up with John Doe",
    "due_date": "2024-12-24",
    "due_time": "14:00",
    "priority": "medium",
    "lead_name": "John Doe"
  },
  "response": "I'll create a task to follow up with John Doe tomorrow at 2pm.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Show my overdue tasks"
Response:
{
  "action": "LIST_MY_TASKS",
  "intent": "List my tasks",
  "parameters": {
    "overdue": true
  },
  "response": "Here are your overdue tasks:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Mark task #5 as done"
Response:
{
  "action": "UPDATE_TASK",
  "intent": "Complete task",
  "parameters": {
    "task_id": "5",
    "status": "completed"
  },
  "response": "I'll mark that task as completed.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Log call with John Doe, discussed pricing and timeline"
Response:
{
  "action": "LOG_ACTIVITY",
  "intent": "Log activity",
  "parameters": {
    "lead_name": "John Doe",
    "activity_type": "call",
    "description": "Discussed pricing and timeline"
  },
  "response": "I'll log a call with John Doe mentioning the discussion about pricing and timeline.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Show Sarah's stats this month"
Response:
{
  "action": "GET_TEAM_STATS",
  "intent": "Get team stats",
  "parameters": {
    "user_name": "Sarah",
    "period": "this_month"
  },
  "response": "Let me get Sarah's performance metrics for this month.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "How am I doing this month?"
Response:
{
  "action": "GET_MY_STATS",
  "intent": "Get my stats",
  "parameters": {
    "period": "this_month"
  },
  "response": "Let me pull your performance metrics for this month.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Update all new leads to contacted status"
Response:
{
  "action": "BULK_UPDATE_LEADS",
  "intent": "Bulk update leads",
  "parameters": {
    "filter_status": "new",
    "update_status": "contacted"
  },
  "response": "I'll show you a preview of leads that will be updated, then update all new leads to contacted status.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Assign all unassigned website leads to Sarah"
Response:
{
  "action": "BULK_ASSIGN_LEADS",
  "intent": "Bulk assign leads",
  "parameters": {
    "filter_assigned": "unassigned",
    "filter_source": "website",
    "assign_to": "Sarah"
  },
  "response": "I'll assign all unassigned website leads to Sarah with a distribution preview.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Show leads grouped by source"
Response:
{
  "action": "GROUP_BY_ANALYSIS",
  "intent": "Group leads by criteria",
  "parameters": {
    "group_by": "source"
  },
  "response": "Here are your leads grouped by source with counts.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Schedule a daily report of new leads"
Response:
{
  "action": "SCHEDULE_REPORT",
  "intent": "Schedule report",
  "parameters": {
    "frequency": "daily",
    "report_type": "new_leads",
    "time": "09:00"
  },
  "response": "I'll schedule a daily report of new leads to be sent to you at 9 AM.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Remind me to follow up with John Doe in 3 days"
Response:
{
  "action": "CREATE_REMINDER",
  "intent": "Create reminder",
  "parameters": {
    "lead_name": "John Doe",
    "reminder_text": "Follow up with John Doe",
    "days_from_now": 3
  },
  "response": "I'll create a reminder to follow up with John Doe in 3 days.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Show my activities"
Response:
{
  "action": "GET_ACTIVITIES",
  "intent": "List user activities",
  "parameters": {},
  "response": "Here are your recent activities:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show my activities from last week"
Response:
{
  "action": "GET_ACTIVITIES",
  "intent": "List user activities in date range",
  "parameters": {
    "date_from": "2024-12-06"
  },
  "response": "Here are your activities from last week:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Create activity: Log call with John Doe about pricing"
Response:
{
  "action": "CREATE_ACTIVITY",
  "intent": "Create activity",
  "parameters": {
    "lead_name": "John Doe",
    "activity_type": "call",
    "description": "Log call with John Doe about pricing"
  },
  "response": "I'll create an activity: \"Log call with John Doe about pricing\"",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Show activity statistics this month"
Response:
{
  "action": "GET_ACTIVITY_STATS",
  "intent": "Get activity statistics",
  "parameters": {
    "period": "this_month"
  },
  "response": "Here are your activity statistics:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show team timeline"
Response:
{
  "action": "GET_TEAM_TIMELINE",
  "intent": "Get team timeline",
  "parameters": {},
  "response": "Here's your team's activity timeline:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Complete activity #5"
Response:
{
  "action": "COMPLETE_ACTIVITY",
  "intent": "Complete activity",
  "parameters": {
    "activity_id": "5"
  },
  "response": "I'll mark activity #5 as completed.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Hello"
Response:
{
  "action": "CHAT",
  "intent": "Greeting",
  "parameters": {},
  "response": "Hello! I'm your CRM assistant. I can help you create, update, and manage leads, assign them to team members, move them through stages, and more. What would you like to do?",
  "needsConfirmation": false,
  "missingFields": []
}

**Important Guidelines:**
- Always extract as much information as possible from the user's message
- If critical fields are missing for CREATE_LEAD (first_name, last_name, email), add them to missingFields
- For UPDATE_LEAD, you need either an email or lead identifier to find the lead
- Use status values exactly as specified
- For dates, convert natural language like "next month" to YYYY-MM-DD format
- Be conversational and helpful
- If the user's intent is unclear, ask for clarification (use "CHAT" action)

**When to Set needsConfirmation:**
- CREATE_LEAD: true (always confirm before creating)
- UPDATE_LEAD: true (always confirm before updating)
- LIST_LEADS: false (no confirmation needed for viewing)
- SEARCH_LEADS: false (no confirmation needed for viewing)
- GET_LEAD: false (no confirmation needed for viewing)
- GET_STATS: false (no confirmation needed for viewing)`;
  }

  /**
   * Process user message with Gemini AI
   */
  sanitizeJsonText(rawText) {
    if (!rawText || !rawText.trim()) {
      throw new Error("Empty response from Gemini");
    }

    let cleanText = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const firstBrace = cleanText.indexOf("{");
    const lastBrace = cleanText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      cleanText = cleanText.slice(firstBrace, lastBrace + 1);
    }

    return cleanText;
  }

  parseGeminiResponse(rawText) {
    const cleanText = this.sanitizeJsonText(rawText);
    return JSON.parse(cleanText);
  }

  isValidResponse(payload) {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    if (
      typeof payload.response !== "string" ||
      payload.response.trim().length === 0
    ) {
      return false;
    }

    if (
      !payload.action ||
      typeof payload.action !== "string" ||
      !VALID_ACTIONS.has(payload.action)
    ) {
      return false;
    }

    if (payload.parameters && typeof payload.parameters !== "object") {
      return false;
    }

    if (payload.missingFields && !Array.isArray(payload.missingFields)) {
      return false;
    }

    return true;
  }

  buildFallbackResponse(userMessage, reason) {
    console.warn(`[CHATBOT] Falling back to pattern matching (${reason})`);
    try {
      const fallbackPayload = chatbotFallback.parseMessage(userMessage);
      return {
        payload: fallbackPayload,
        source: "fallback",
        model: "pattern-matching",
      };
    } catch (error) {
      console.error("[CHATBOT] Fallback handler failed:", error);
      throw new ApiError(
        "Unable to process your message. Please try again.",
        500,
      );
    }
  }

  async generateWithGemini(prompt) {
    if (!this.genAI || this.geminiModels.length === 0) {
      throw new Error("Gemini models are not available");
    }

    // Check circuit breaker before attempting request
    const circuitCheck = this.checkCircuitBreaker();
    if (!circuitCheck.allowed) {
      console.warn(`[CHATBOT] Circuit breaker blocked request: ${circuitCheck.reason}`);
      this.recordCircuitBreakerFailure();
      throw new Error(`Circuit breaker is OPEN - ${circuitCheck.reason}`);
    }

    // Execute with retry logic and circuit breaker tracking
    const result = await this.executeWithRetry(async () => {
      let lastError = null;

      for (const modelName of this.geminiModels) {
        try {
          // Check circuit breaker before each model attempt
          const cbCheck = this.checkCircuitBreaker();
          if (!cbCheck.allowed && cbCheck.state === "OPEN") {
            throw new Error(`Circuit breaker is OPEN - cannot proceed`);
          }

          if (!this.modelCache.has(modelName)) {
            this.modelCache.set(
              modelName,
              this.genAI.getGenerativeModel({ model: modelName }),
            );
          }

          const model = this.modelCache.get(modelName);
          const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Request timeout")),
                CIRCUIT_BREAKER_CONFIG.testTimeout,
              ),
            ),
          ]);
          const response = await result.response;
          const text = response.text();

          if (!text || !text.trim()) {
            throw new Error("Empty response from Gemini");
          }

          // Extract token usage information if available
          let usage = {
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
          };

          try {
            // Try to get usage metadata from response
            if (response.usageMetadata) {
              usage.inputTokens = response.usageMetadata.promptTokenCount || 0;
              usage.outputTokens = response.usageMetadata.candidatesTokenCount || 0;
            } else {
              // Fallback: estimate tokens (roughly 4 characters per token)
              usage.inputTokens = Math.ceil(prompt.length / 4);
              usage.outputTokens = Math.ceil(text.length / 4);
            }

            // Calculate cost based on model
            const modelCosts = MODEL_COSTS[modelName] || MODEL_COSTS["gemini-1.5-flash-latest"];
            usage.cost =
              (usage.inputTokens / 1000) * modelCosts.input +
              (usage.outputTokens / 1000) * modelCosts.output;
          } catch (usageError) {
            console.warn("[CHATBOT] Could not extract token usage:", usageError.message);
            // Continue with zero usage - not critical
          }

          // Record circuit breaker success
          this.recordCircuitBreakerSuccess();

          console.log(
            `[CHATBOT] Gemini model ${modelName} responded successfully (${usage.inputTokens} in, ${usage.outputTokens} out, $${usage.cost.toFixed(6)})`,
          );
          return { text, modelName, usage };
        } catch (error) {
          lastError = error;
          console.error(
            `[CHATBOT] Gemini model ${modelName} error:`,
            error.message,
          );

          // Record circuit breaker failure
          this.recordCircuitBreakerFailure();
        }
      }

      throw lastError || new Error("All Gemini models failed");
    });

    return result;
  }

  async processMessage(userId, userMessage, currentUser) {
    const startTime = Date.now();
    const correlationId = this.logAIRequestStart(userId, userMessage, {
      userRole: currentUser?.role,
      companyId: currentUser?.company_id,
    });

    try {
      // Log user context
      this.createLogEntry("DEBUG", "user_context", {
        correlationId,
        userId,
        userRole: currentUser?.role,
        companyId: currentUser?.company_id,
      });

      // Sanitize user input to prevent prompt injection
      const sanitizedMessage = this.sanitizeInput(userMessage);

      // If message is empty after sanitization, return error
      if (!sanitizedMessage) {
        throw new ApiError(
          "Your message contained potentially harmful content and could not be processed.",
          400,
        );
      }

      // Add sanitized user message to history
      this.addToHistory(userId, "user", sanitizedMessage);

      // Build conversation context with sanitized history
      const history = this.getConversationHistory(userId);
      const contextMessages = history
        .slice(-5) // Last 5 messages
        .map((h) => {
          // Sanitize each history entry
          const sanitizedContent = this.sanitizeInput(h.content);
          return `${h.role}: ${sanitizedContent}`;
        })
        .join("\n");

      // Create prompt with system context and sanitized user message
      const prompt = `${this.getSystemPrompt()}

**Previous Conversation:**
${contextMessages}

**Current User Message:**
${sanitizedMessage}

**User Context:**
- User ID: ${currentUser.id}
- User Role: ${currentUser.role}
- Company ID: ${currentUser.company_id}

Analyze the message and respond ONLY with valid JSON. Do not include any markdown formatting or code blocks.`;

      // Check rate limit before processing
      if (!this.useFallbackOnly) {
        const rateLimitCheck = await this.checkRateLimit();
        if (!rateLimitCheck.allowed) {
          console.warn(`[CHATBOT] Rate limit exceeded for user ${userId}`);
          throw new ApiError(
            `Rate limit exceeded. ${rateLimitCheck.error}`,
            429,
          );
        }
      }

      // Check budget before AI generation
      let budgetCheck = null;
      if (!this.useFallbackOnly && this.geminiModels.length > 0) {
        const primaryModel = this.geminiModels[0];
        const estimatedTokens = prompt.length / 4; // Rough estimate: 4 chars per token
        budgetCheck = this.checkBudget(
          primaryModel,
          estimatedTokens,
          500, // Estimated output tokens
        );

        if (!budgetCheck.allowed) {
          console.warn(
            `[CHATBOT] Budget check failed: ${budgetCheck.reason} for user ${userId}`,
          );
          throw new ApiError(
            `Budget limit exceeded (${budgetCheck.reason.replace(/_/g, " ")}). Please try again later.`,
            429,
          );
        }
      }

      let parsedResponse;
      let source = "gemini";
      let modelUsed = null;

      if (this.useFallbackOnly) {
        const fallback = this.buildFallbackResponse(
          userMessage,
          "fallback_only_mode",
        );
        parsedResponse = fallback.payload;
        source = fallback.source;
        modelUsed = fallback.model;
      } else {
        try {
          const { text, modelName, usage } = await this.generateWithGemini(prompt);
          modelUsed = modelName;
          parsedResponse = this.parseGeminiResponse(text);

          if (!this.isValidResponse(parsedResponse)) {
            throw new Error("Invalid response structure from Gemini");
          }

          // Record usage for successful AI request
          if (usage && budgetCheck) {
            const actualCost = usage.cost || budgetCheck.estimatedCost || 0;
            this.recordUsage(
              modelName,
              usage.inputTokens || 0,
              usage.outputTokens || 0,
              actualCost,
            );
          }
        } catch (geminiError) {
          console.error("[CHATBOT] Gemini processing error:", geminiError);
          const fallback = this.buildFallbackResponse(
            userMessage,
            geminiError.message || "gemini_error",
          );
          parsedResponse = fallback.payload;
          source = fallback.source;
          modelUsed = fallback.model;
        }
      }

      parsedResponse.parameters =
        parsedResponse.parameters &&
        typeof parsedResponse.parameters === "object"
          ? parsedResponse.parameters
          : {};

      this.addToHistory(userId, "assistant", parsedResponse.response);

      // Execute action if needed
      let actionResult = null;
      if (parsedResponse.action && parsedResponse.action !== "CHAT") {
        actionResult = await this.executeAction(
          parsedResponse.action,
          parsedResponse.parameters,
          currentUser,
          parsedResponse.needsConfirmation,
        );
      }

      const needsConfirmation =
        Boolean(parsedResponse.needsConfirmation) &&
        parsedResponse.action !== "CHAT";

      const result = {
        success: true,
        response: parsedResponse.response,
        action: parsedResponse.action || "CHAT",
        intent: parsedResponse.intent || null,
        parameters: parsedResponse.parameters,
        needsConfirmation,
        missingFields: Array.isArray(parsedResponse.missingFields)
          ? parsedResponse.missingFields
          : [],
        data: actionResult && !actionResult.pending ? actionResult : null,
        pendingActionToken:
          actionResult && actionResult.pending
            ? actionResult.confirmationToken
            : null,
        pendingActionExpiresAt:
          actionResult && actionResult.pending ? actionResult.expiresAt : null,
        source,
        model: modelUsed,
      };

      // Log successful completion
      const duration = Date.now() - startTime;
      this.logAIRequestComplete(
        {
          startTime,
          duration,
          success: true,
          model: modelUsed,
          usage: { inputTokens: 0, outputTokens: 0 }, // Will be updated by recordUsage
          cost: 0,
        },
        correlationId,
      );

      // Track metrics
      this.createLogEntry("INFO", "message_processed", {
        correlationId,
        duration,
        action: result.action,
        intent: result.intent,
        source: result.source,
        model: result.model,
        needsConfirmation: result.needsConfirmation,
        hasData: !!result.data,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error details
      this.createLogEntry("ERROR", "message_processing_error", {
        correlationId,
        duration,
        errorType: error.constructor.name,
        errorMessage: error.message,
        isApiError: error instanceof ApiError,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 stack lines
      });

      // Log to monitoring system
      this.logAIRequestComplete(
        {
          startTime,
          duration,
          error: error.message,
        },
        correlationId,
      );

      console.error("[CHATBOT] Chatbot processing error:", error);

      // If it's already an ApiError (like rate limit, budget, validation), re-throw it
      if (error instanceof ApiError) {
        throw error;
      }

      // Store conversation state for recovery before failing
      try {
        await this.storeConversationState(userId, {
          message: userMessage,
          user: currentUser,
          error: error.message,
        });
      } catch (storeError) {
        console.warn("[CHATBOT] Failed to store conversation state:", storeError);
      }

      // Use graceful degradation for unexpected errors
      console.warn("[CHATBOT] Using graceful degradation due to error:", error.message);
      const degradationResponse = this.gracefulDegradation(
        userMessage,
        error.message || "unknown_error",
      );

      // Log degradation
      this.createLogEntry("WARN", "graceful_degradation_activated", {
        correlationId,
        reason: error.message || "unknown_error",
        degradationResponse: degradationResponse.degradationReason,
      });

      // Track degradation count
      this.metrics.requests.degraded++;

      // Return a graceful degradation response instead of throwing
      return {
        success: true,
        response: degradationResponse.response,
        action: "CHAT",
        intent: null,
        parameters: {},
        needsConfirmation: false,
        missingFields: [],
        data: null,
        pendingActionToken: null,
        pendingActionExpiresAt: null,
        source: "degradation",
        model: "fallback",
        fallback: true,
        degradationReason: degradationResponse.degradationReason,
        canAssistWith: degradationResponse.canAssistWith,
        contactForHelp: degradationResponse.contactForHelp,
        suggestedActions: degradationResponse.suggestedActions,
      };
    }
  }

  /**
   * Execute the action determined by AI
   */
  async executeAction(action, parameters, currentUser, needsConfirmation) {
    try {
      // If confirmation is needed, don't execute yet
      if (needsConfirmation) {
        const { token, expiresAt } = createPendingActionToken({
          userId: currentUser.id,
          action,
          parameters,
        });
        return {
          pending: true,
          action,
          parameters,
          confirmationToken: token,
          expiresAt,
        };
      }

      switch (action) {
        case "CREATE_LEAD":
          return await this.createLead(parameters, currentUser);

        case "UPDATE_LEAD":
          return await this.updateLead(parameters, currentUser);

        case "GET_LEAD":
          return await this.getLead(parameters, currentUser);

        case "SEARCH_LEADS":
          return await this.searchLeads(parameters, currentUser);

        case "LIST_LEADS":
          return await this.listLeads(parameters, currentUser);

        case "GET_STATS":
          return await this.getStats(currentUser);

        case "DELETE_LEAD":
          return await this.deleteLead(parameters, currentUser);

        case "ADD_LEAD_NOTE":
          return await this.addLeadNote(parameters, currentUser);

        case "VIEW_LEAD_NOTES":
          return await this.viewLeadNotes(parameters, currentUser);

        case "MOVE_LEAD_STAGE":
          return await this.moveLeadStage(parameters, currentUser);

        case "ASSIGN_LEAD":
          return await this.assignLead(parameters, currentUser);

        case "UNASSIGN_LEAD":
          return await this.unassignLead(parameters, currentUser);

        case "DETECT_DUPLICATES":
          return await this.detectDuplicates(parameters, currentUser);

        case "EXPORT_LEADS":
          return await this.exportLeads(parameters, currentUser);

        case "SUGGEST_ASSIGNMENT":
          return await this.suggestAssignment(parameters, currentUser);

        case "LEAD_SCORING":
          return await this.scoreLeads(parameters, currentUser);

        case "CREATE_TASK":
          return await this.createTask(parameters, currentUser);

        case "LIST_MY_TASKS":
          return await this.listMyTasks(parameters, currentUser);

        case "UPDATE_TASK":
          return await this.updateTask(parameters, currentUser);

        case "GET_TASKS":
          return await this.getTasks(parameters, currentUser);

        case "GET_TASK_BY_ID":
          return await this.getTaskById(parameters, currentUser);

        case "COMPLETE_TASK":
          return await this.completeTask(parameters, currentUser);

        case "DELETE_TASK":
          return await this.deleteTask(parameters, currentUser);

        case "GET_OVERDUE_TASKS":
          return await this.getOverdueTasks(parameters, currentUser);

        case "GET_TASK_STATS":
          return await this.getTaskStats(parameters, currentUser);

        case "GET_TASKS_BY_LEAD_ID":
          return await this.getTasksByLeadId(parameters, currentUser);

        // EmailSend Module Cases (7)
        case "SEND_TO_LEAD":
          return await this.sendToLead(parameters, currentUser);

        case "SEND_TO_EMAIL":
          return await this.sendToEmail(parameters, currentUser);

        case "GET_SENT_EMAILS":
          return await this.getSentEmails(parameters, currentUser);

        case "GET_EMAIL_DETAILS":
          return await this.getEmailDetails(parameters, currentUser);

        case "GET_SUPPRESSION_LIST":
          return await this.getSuppressionList(parameters, currentUser);

        case "ADD_TO_SUPPRESSION_LIST":
          return await this.addToSuppressionList(parameters, currentUser);

        case "REMOVE_FROM_SUPPRESSION_LIST":
          return await this.removeFromSuppressionList(parameters, currentUser);

        // EmailTemplate Module Cases (12)
        case "GET_TEMPLATES":
          return await this.getTemplates(parameters, currentUser);

        case "GET_TEMPLATE_BY_ID":
          return await this.getTemplateById(parameters, currentUser);

        case "CREATE_TEMPLATE":
          return await this.createTemplate(parameters, currentUser);

        case "UPDATE_TEMPLATE":
          return await this.updateTemplate(parameters, currentUser);

        case "DELETE_TEMPLATE":
          return await this.deleteTemplate(parameters, currentUser);

        case "CREATE_VERSION":
          return await this.createVersion(parameters, currentUser);

        case "PUBLISH_VERSION":
          return await this.publishVersion(parameters, currentUser);

        case "COMPILE_MJML":
          return await this.compileMJML(parameters, currentUser);

        case "PREVIEW_TEMPLATE":
          return await this.previewTemplate(parameters, currentUser);

        case "GET_FOLDERS":
          return await this.getFolders(parameters, currentUser);

        case "GET_INTEGRATION_SETTINGS":
          return await this.getIntegrationSettings(parameters, currentUser);

        case "UPSERT_INTEGRATION_SETTINGS":
          return await this.upsertIntegrationSettings(parameters, currentUser);

        // Automation Module Cases (9)
        case "GET_SEQUENCES":
          return await this.getSequences(parameters, currentUser);

        case "GET_SEQUENCE_BY_ID":
          return await this.getSequenceById(parameters, currentUser);

        case "CREATE_SEQUENCE":
          return await this.createSequence(parameters, currentUser);

        case "UPDATE_SEQUENCE":
          return await this.updateSequence(parameters, currentUser);

        case "DELETE_SEQUENCE":
          return await this.deleteSequence(parameters, currentUser);

        case "ENROLL_LEAD":
          return await this.enrollLead(parameters, currentUser);

        case "UNENROLL_LEAD":
          return await this.unenrollLead(parameters, currentUser);

        case "GET_ENROLLMENTS":
          return await this.getEnrollments(parameters, currentUser);

        case "PROCESS_DUE_ENROLLMENTS":
          return await this.processDueEnrollments(parameters, currentUser);

        // WorkflowTemplate Module Cases (10)
        case "GET_WORKFLOW_TEMPLATES":
          return await this.getWorkflowTemplates(parameters, currentUser);

        case "GET_WORKFLOW_TEMPLATE_BY_ID":
          return await this.getWorkflowTemplateById(parameters, currentUser);

        case "CREATE_WORKFLOW_TEMPLATE":
          return await this.createWorkflowTemplate(parameters, currentUser);

        case "CREATE_SEQUENCE_FROM_TEMPLATE":
          return await this.createSequenceFromTemplate(parameters, currentUser);

        case "UPDATE_WORKFLOW_TEMPLATE":
          return await this.updateWorkflowTemplate(parameters, currentUser);

        case "DELETE_WORKFLOW_TEMPLATE":
          return await this.deleteWorkflowTemplate(parameters, currentUser);

        case "EXPORT_WORKFLOW_TEMPLATE":
          return await this.exportWorkflowTemplate(parameters, currentUser);

        case "IMPORT_WORKFLOW_TEMPLATE":
          return await this.importWorkflowTemplate(parameters, currentUser);

        case "GET_TEMPLATE_PACKS":
          return await this.getTemplatePacks(parameters, currentUser);

        case "GET_PACK_BY_ID":
          return await this.getPackById(parameters, currentUser);

        case "LOG_ACTIVITY":
          return await this.logActivity(parameters, currentUser);

        case "GET_TEAM_STATS":
          return await this.getTeamStats(parameters, currentUser);

        case "GET_MY_STATS":
          return await this.getMyStats(parameters, currentUser);

        case "BULK_UPDATE_LEADS":
          return await this.bulkUpdateLeads(parameters, currentUser);

        case "BULK_ASSIGN_LEADS":
          return await this.bulkAssignLeads(parameters, currentUser);

        case "GROUP_BY_ANALYSIS":
          return await this.groupByAnalysis(parameters, currentUser);

        case "SCHEDULE_REPORT":
          return await this.scheduleReport(parameters, currentUser);

        case "CREATE_REMINDER":
          return await this.createReminder(parameters, currentUser);

        case "GET_ACTIVITIES":
          return await this.getActivities(parameters, currentUser);

        case "CREATE_ACTIVITY":
          return await this.createActivity(parameters, currentUser);

        case "GET_ACTIVITY_STATS":
          return await this.getActivityStats(parameters, currentUser);

        case "GET_TEAM_TIMELINE":
          return await this.getTeamTimeline(parameters, currentUser);

        case "COMPLETE_ACTIVITY":
          return await this.completeActivity(parameters, currentUser);

        case "GET_ACTIVITY_BY_ID":
          return await this.getActivityById(parameters, currentUser);

        case "GET_LEAD_TIMELINE":
          return await this.getLeadTimeline(parameters, currentUser);

        case "GET_LEAD_ACTIVITIES":
          return await this.getLeadActivities(parameters, currentUser);

        case "GET_USER_ACTIVITIES":
          return await this.getUserActivities(parameters, currentUser);

        case "CREATE_BULK_ACTIVITIES":
          return await this.createBulkActivities(parameters, currentUser);

        case "UPDATE_ACTIVITY":
          return await this.updateActivity(parameters, currentUser);

        case "DELETE_ACTIVITY":
          return await this.deleteActivity(parameters, currentUser);

        case "GET_LEAD_TIMELINE_SUMMARY":
          return await this.getLeadTimelineSummary(parameters, currentUser);

        case "GET_USER_TIMELINE":
          return await this.getUserTimeline(parameters, currentUser);

        case "GET_ACTIVITY_TRENDS":
          return await this.getActivityTrends(parameters, currentUser);

        // Assignment Module Cases
        case "GET_TEAM_WORKLOAD":
          return await this.getTeamWorkload(parameters, currentUser);

        case "AUTO_ASSIGN_LEAD":
          return await this.autoAssignLead(parameters, currentUser);

        case "CREATE_ASSIGNMENT_RULE":
          return await this.createAssignmentRule(parameters, currentUser);

        case "GET_ASSIGNMENT_RECOMMENDATIONS":
          return await this.getAssignmentRecommendations(
            parameters,
            currentUser,
          );

        case "REDISTRIBUTE_LEADS":
          return await this.redistributeLeads(parameters, currentUser);

        case "REASSIGN_LEAD":
          return await this.reassignLead(parameters, currentUser);

        case "GET_ASSIGNMENT_STATS":
          return await this.getAssignmentStats(parameters, currentUser);

        case "GET_ASSIGNMENT_HISTORY":
          return await this.getAssignmentHistory(parameters, currentUser);

        case "GET_ACTIVE_RULES":
          return await this.getActiveRules(parameters, currentUser);

        case "GET_ROUTING_STATS":
          return await this.getRoutingStats(parameters, currentUser);

        // Pipeline Module Cases
        case "GET_STAGES":
          return await this.getStages(parameters, currentUser);

        case "CREATE_STAGE":
          return await this.createStage(parameters, currentUser);

        case "UPDATE_STAGE":
          return await this.updateStage(parameters, currentUser);

        case "DELETE_STAGE":
          return await this.deleteStage(parameters, currentUser);

        case "REORDER_STAGES":
          return await this.reorderStages(parameters, currentUser);

        case "GET_PIPELINE_OVERVIEW":
          return await this.getPipelineOverview(parameters, currentUser);

        case "MOVE_LEAD_TO_STAGE":
          return await this.moveLeadToStage(parameters, currentUser);

        case "GET_CONVERSION_RATES":
          return await this.getConversionRates(parameters, currentUser);

        case "CREATE_DEFAULT_STAGES":
          return await this.createDefaultStages(parameters, currentUser);

        // Week 4: Import/Export Module Cases (8)
        case "IMPORT_LEADS":
          return await this.importLeads(parameters, currentUser);

        case "DRY_RUN_LEADS":
          return await this.dryRunLeads(parameters, currentUser);

        case "GET_IMPORT_HISTORY":
          return await this.getImportHistory(parameters, currentUser);

        case "VALIDATE_IMPORT_FILE":
          return await this.validateImportFile(parameters, currentUser);

        case "CONVERT_TO_CSV":
          return await this.convertToCsv(parameters, currentUser);

        case "CONVERT_TO_EXCEL":
          return await this.convertToExcel(parameters, currentUser);

        case "GET_SUGGESTED_MAPPINGS":
          return await this.getSuggestedMappings(parameters, currentUser);

        case "GET_UPLOAD_MIDDLEWARE":
          return await this.getUploadMiddleware(parameters, currentUser);

        // Week 4: Auth Module Cases (6)
        case "REGISTER":
          return await this.register(parameters, currentUser);

        case "LOGIN":
          return await this.login(parameters, currentUser);

        case "GET_PROFILE":
          return await this.getProfile(parameters, currentUser);

        case "UPDATE_PROFILE":
          return await this.updateProfile(parameters, currentUser);

        case "CHANGE_PASSWORD":
          return await this.changePassword(parameters, currentUser);

        case "LOGOUT":
          return await this.logout(parameters, currentUser);

        // Week 4: EmailWebhook Module Cases (3)
        case "HANDLE_POSTMARK_WEBHOOK":
          return await this.handlePostmarkWebhook(parameters, currentUser);

        case "HANDLE_SENDGRID_WEBHOOK":
          return await this.handleSendgridWebhook(parameters, currentUser);

        case "TEST_WEBHOOK":
          return await this.testWebhook(parameters, currentUser);

        // Week 4: LeadCapture Module Cases (1)
        case "CREATE_CAPTURE_FORM":
          return await this.createCaptureForm(parameters, currentUser);

        default:
          return null;
      }
    } catch (error) {
      console.error("Action execution error:", error);
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  async createLead(parameters, currentUser) {
    const leadData = {
      first_name: parameters.first_name,
      last_name: parameters.last_name,
      email: parameters.email,
      phone: parameters.phone || null,
      company: parameters.company || null,
      job_title: parameters.job_title || null,
      lead_source: parameters.lead_source || "other",
      status: parameters.status || "new",
      deal_value: parameters.deal_value || null,
      expected_close_date: parameters.expected_close_date || null,
      priority: parameters.priority || "medium",
      notes: parameters.notes || null,
      created_by: currentUser.id,
      company_id: currentUser.company_id,
    };

    const lead = await leadService.createLead(leadData);
    return { lead, action: "created" };
  }

  /**
   * Update an existing lead
   */
  async updateLead(parameters, currentUser) {
    // Find lead by email or ID
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead to update", 404);
    }

    // Prepare update data (only include fields that are provided)
    const updateData = {};
    if (parameters.first_name) updateData.first_name = parameters.first_name;
    if (parameters.last_name) updateData.last_name = parameters.last_name;
    if (parameters.email) updateData.email = parameters.email;
    if (parameters.phone) updateData.phone = parameters.phone;
    if (parameters.company) updateData.company = parameters.company;
    if (parameters.job_title) updateData.job_title = parameters.job_title;
    if (parameters.lead_source) updateData.lead_source = parameters.lead_source;
    if (parameters.status) updateData.status = parameters.status;
    if (parameters.deal_value !== undefined)
      updateData.deal_value = parameters.deal_value;
    if (parameters.expected_close_date)
      updateData.expected_close_date = parameters.expected_close_date;
    if (parameters.priority) updateData.priority = parameters.priority;
    if (parameters.notes) updateData.notes = parameters.notes;

    const leadResult = await leadService.updateLead(
      leadId,
      updateData,
      currentUser,
    );

    if (!leadResult) {
      throw new ApiError("Lead not found", 404);
    }

    return { lead: leadResult.updatedLead, action: "updated" };
  }

  /**
   * Get a specific lead
   */
  async getLead(parameters, currentUser) {
    if (parameters.lead_id) {
      const lead = await leadService.getLeadById(parameters.lead_id);
      return { leads: [lead], count: 1 };
    }

    if (parameters.email) {
      const leads = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      return { leads, count: leads.length };
    }

    throw new ApiError("Please provide a lead ID or email", 400);
  }

  /**
   * Search leads
   */
  async searchLeads(parameters, currentUser) {
    const query = parameters.search || parameters.query || "";
    const limit = parameters.limit || 10;

    const leads = await leadService.searchLeads(query, limit, currentUser);
    return { leads, count: leads.length };
  }

  /**
   * List leads with filters
   */
  async listLeads(parameters, currentUser) {
    const DateParser = require("../utils/dateParser");
    const page = parameters.page || 1;
    const limit = parameters.limit || 10;

    const filters = {
      status: parameters.status || "",
      source: parameters.source || parameters.lead_source || "",
      assigned_to: parameters.assigned_to || "",
      sort_by: parameters.sort_by || "created_at",
      sort_order: parameters.sort_order || "desc",
    };

    // Handle date range filters
    if (parameters.created_after) {
      filters.date_from = parameters.created_after;
    }
    if (parameters.created_before) {
      filters.date_to = parameters.created_before;
    }

    // Handle deal value range filters
    if (parameters.deal_value_min) {
      filters.deal_value_min = parameters.deal_value_min;
    }
    if (parameters.deal_value_max) {
      filters.deal_value_max = parameters.deal_value_max;
    }

    const result = await leadService.getLeads(
      currentUser,
      page,
      limit,
      filters,
    );
    return {
      leads: result.leads,
      count: result.totalItems,
      pagination: {
        current_page: result.currentPage,
        total_pages: result.totalPages,
        has_next: result.hasNext,
        has_prev: result.hasPrev,
      },
    };
  }

  /**
   * Get lead statistics
   */
  async getStats(currentUser) {
    const stats = await leadService.getLeadStats(currentUser);
    return { stats };
  }

  /**
   * Confirm and execute pending action
   */
  async confirmAction(userId, action, parameters, currentUser) {
    return await this.executeAction(action, parameters, currentUser, false);
  }

  /**
   * Delete a lead
   */
  async deleteLead(parameters, currentUser) {
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(
        parameters.search,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead to delete", 404);
    }

    const result = await leadService.deleteLead(leadId, currentUser);
    return { lead: result.deletedLead, action: "deleted" };
  }

  /**
   * Add or update notes for a lead
   */
  async addLeadNote(parameters, currentUser) {
    let leadId = parameters.lead_id;
    const noteContent = parameters.note_content || parameters.note || "";

    if (!noteContent.trim()) {
      throw new ApiError("Note content is required", 400);
    }

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(
        parameters.search,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead to add note to", 404);
    }

    const updateData = { notes: noteContent };
    const leadResult = await leadService.updateLead(
      leadId,
      updateData,
      currentUser,
    );

    return { lead: leadResult.updatedLead, action: "note_added" };
  }

  /**
   * View notes and activities for a lead
   */
  async viewLeadNotes(parameters, currentUser) {
    const activityService = require("./activityService");
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(
        parameters.search,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead", 404);
    }

    const lead = await leadService.getLeadById(leadId);
    const activitiesResult = await activityService.getActivities(currentUser, {
      lead_id: leadId,
    });

    return {
      lead: { id: lead.id, name: lead.name, notes: lead.notes },
      activities: activitiesResult.data || [],
      action: "viewed",
    };
  }

  /**
   * Move lead to a different pipeline stage
   */
  async moveLeadStage(parameters, currentUser) {
    const pipelineService = require("./pipelineService");
    let leadId = parameters.lead_id;
    const stageName = parameters.stage_name || parameters.stage || "";

    if (!stageName.trim()) {
      throw new ApiError("Stage name is required", 400);
    }

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(
        parameters.search,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead to move", 404);
    }

    const stagesResult = await pipelineService.getAllStages(currentUser);
    if (!stagesResult.success) {
      throw new ApiError("Could not fetch pipeline stages", 500);
    }

    const stages = stagesResult.data || [];
    const targetStage = stages.find((s) =>
      s.name.toLowerCase().includes(stageName.toLowerCase()),
    );

    if (!targetStage) {
      throw new ApiError(`Pipeline stage '${stageName}' not found`, 404);
    }

    const updateData = { pipeline_stage_id: targetStage.id };
    const leadResult = await leadService.updateLead(
      leadId,
      updateData,
      currentUser,
    );

    return {
      lead: leadResult.updatedLead,
      stage: targetStage.name,
      action: "moved",
    };
  }

  /**
   * Assign lead to a team member
   */
  async assignLead(parameters, currentUser) {
    const { supabaseAdmin } = require("../config/supabase");
    let leadId = parameters.lead_id;
    const assignTo = parameters.assigned_to || parameters.assign_to || "";

    if (!assignTo.trim()) {
      throw new ApiError("Team member name or email is required", 400);
    }

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(
        parameters.search,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead to assign", 404);
    }

    const { data: users, error: usersError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, first_name, last_name, email")
      .eq("company_id", currentUser.company_id);

    if (usersError) {
      throw new ApiError("Could not fetch team members", 500);
    }

    const targetUser = users.find(
      (u) =>
        u.first_name.toLowerCase().includes(assignTo.toLowerCase()) ||
        u.last_name.toLowerCase().includes(assignTo.toLowerCase()) ||
        u.email.toLowerCase().includes(assignTo.toLowerCase()),
    );

    if (!targetUser) {
      throw new ApiError(`Team member '${assignTo}' not found`, 404);
    }

    const updateData = {
      assigned_to: targetUser.id,
      assigned_at: new Date().toISOString(),
    };
    const leadResult = await leadService.updateLead(
      leadId,
      updateData,
      currentUser,
    );

    return {
      lead: leadResult.updatedLead,
      assigned_to: `${targetUser.first_name} ${targetUser.last_name}`,
      action: "assigned",
    };
  }

  /**
   * Unassign lead from current assignee
   */
  async unassignLead(parameters, currentUser) {
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(
        parameters.search,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead to unassign", 404);
    }

    const updateData = { assigned_to: null };
    const leadResult = await leadService.updateLead(
      leadId,
      updateData,
      currentUser,
    );

    return { lead: leadResult.updatedLead, action: "unassigned" };
  }

  /**
   * Detect duplicate leads
   */
  async detectDuplicates(parameters, currentUser) {
    const { supabaseAdmin } = require("../config/supabase");

    let searchEmail = parameters.email;
    let searchPhone = parameters.phone;
    let searchCompany = parameters.company;
    let searchName = parameters.search;

    // Try to extract from lead if searching by ID
    if (parameters.lead_id && !searchEmail && !searchPhone) {
      const lead = await leadService.getLeadById(parameters.lead_id);
      searchEmail = lead.email;
      searchPhone = lead.phone;
      searchCompany = lead.company;
      searchName = lead.name;
    }

    if (!searchEmail && !searchPhone && !searchCompany && !searchName) {
      throw new ApiError(
        "Please provide email, phone, company, or lead name to check for duplicates",
        400,
      );
    }

    let query = supabaseAdmin
      .from("leads")
      .select("id, name, email, phone, company, status, created_at")
      .eq("company_id", currentUser.company_id);

    const duplicates = [];

    // Check for email duplicates
    if (searchEmail) {
      const { data: emailMatches } = await query
        .ilike("email", `%${searchEmail}%`)
        .limit(10);

      if (emailMatches && emailMatches.length > 1) {
        duplicates.push({
          type: "email",
          value: searchEmail,
          matches: emailMatches.slice(0, 5),
        });
      }
    }

    // Check for phone duplicates
    if (searchPhone) {
      const { data: phoneMatches } = await supabaseAdmin
        .from("leads")
        .select("id, name, email, phone, company, status")
        .eq("company_id", currentUser.company_id)
        .ilike("phone", `%${searchPhone}%`)
        .limit(10);

      if (phoneMatches && phoneMatches.length > 1) {
        duplicates.push({
          type: "phone",
          value: searchPhone,
          matches: phoneMatches.slice(0, 5),
        });
      }
    }

    // Check for company duplicates
    if (searchCompany) {
      const { data: companyMatches } = await supabaseAdmin
        .from("leads")
        .select("id, name, email, phone, company, status")
        .eq("company_id", currentUser.company_id)
        .ilike("company", `%${searchCompany}%`)
        .limit(10);

      if (companyMatches && companyMatches.length > 1) {
        duplicates.push({
          type: "company",
          value: searchCompany,
          matches: companyMatches.slice(0, 5),
        });
      }
    }

    return {
      found: duplicates.length > 0,
      duplicates,
      summary:
        duplicates.length === 0
          ? "No duplicates found"
          : `Found ${duplicates.length} potential duplicate${duplicates.length > 1 ? "s" : ""}`,
    };
  }

  /**
   * Export leads to CSV or Excel
   */
  async exportLeads(parameters, currentUser) {
    const importController = require("../controllers/importController");
    const page = parameters.page || 1;
    const limit = parameters.limit || 1000;

    const filters = {
      status: parameters.status || "",
      source: parameters.source || parameters.lead_source || "",
      assigned_to: parameters.assigned_to || "",
      date_from: parameters.created_after || "",
      date_to: parameters.created_before || "",
      deal_value_min: parameters.deal_value_min || "",
      deal_value_max: parameters.deal_value_max || "",
    };

    try {
      const result = await leadService.getLeads(
        currentUser,
        page,
        limit,
        filters,
      );

      if (!result.leads || result.leads.length === 0) {
        throw new ApiError("No leads found to export", 404);
      }

      const format = (parameters.format || "csv").toLowerCase();

      // Prepare leads data for export
      const leadsForExport = result.leads.map((lead) => ({
        "First Name": lead.first_name || "",
        "Last Name": lead.last_name || "",
        Email: lead.email || "",
        Phone: lead.phone || "",
        Company: lead.company || "",
        "Job Title": lead.job_title || "",
        Source: lead.lead_source || "",
        Status: lead.status || "",
        "Deal Value": lead.deal_value || "",
        "Expected Close Date": lead.expected_close_date || "",
        Priority: lead.priority || "",
        Notes: lead.notes || "",
        "Created At": lead.created_at || "",
      }));

      return {
        success: true,
        data: leadsForExport,
        count: leadsForExport.length,
        format,
        message: `Exported ${leadsForExport.length} lead${leadsForExport.length > 1 ? "s" : ""} in ${format.toUpperCase()} format`,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to export leads", 500);
    }
  }

  /**
   * Suggest assignment for a lead
   */
  async suggestAssignment(parameters, currentUser) {
    const { supabaseAdmin } = require("../config/supabase");
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(
        parameters.email,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(
        parameters.search,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead", 404);
    }

    const lead = await leadService.getLeadById(leadId);

    // Get all active users
    const { data: users } = await supabaseAdmin
      .from("user_profiles")
      .select("id, first_name, last_name, role")
      .eq("company_id", currentUser.company_id)
      .eq("status", "active");

    // Get team member workload (number of assigned leads)
    const { data: assignmentCounts } = await supabaseAdmin
      .from("leads")
      .select("assigned_to", { count: "exact" })
      .eq("company_id", currentUser.company_id)
      .eq("status", "active");

    const workloadMap = {};
    assignmentCounts?.forEach((assignment) => {
      if (assignment.assigned_to) {
        workloadMap[assignment.assigned_to] =
          (workloadMap[assignment.assigned_to] || 0) + 1;
      }
    });

    // Score users based on role and workload
    const suggestions =
      users
        ?.filter((u) => u.role === "sales_rep" || u.role === "manager")
        .map((u) => ({
          user_id: u.id,
          name: `${u.first_name} ${u.last_name}`,
          role: u.role,
          workload: workloadMap[u.id] || 0,
          score: this.calculateAssignmentScore(workloadMap[u.id] || 0, u.role),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3) || [];

    return {
      lead: { id: lead.id, name: lead.name, email: lead.email },
      suggestions,
      top_suggestion: suggestions[0] || null,
      summary:
        suggestions.length > 0
          ? `Recommended: ${suggestions[0].name}`
          : "No available team members",
    };
  }

  /**
   * Calculate assignment score based on workload and role
   */
  calculateAssignmentScore(workload, role) {
    const roleWeight = role === "manager" ? 1.2 : 1.0;
    const workloadPenalty = workload * 0.5;
    return (10 - workloadPenalty) * roleWeight;
  }

  /**
   * Score leads by engagement and potential
   */
  async scoreLeads(parameters, currentUser) {
    const page = parameters.page || 1;
    const limit = parameters.limit || 20;

    const filters = {
      status: parameters.status || "",
      source: parameters.source || parameters.lead_source || "",
      assigned_to: parameters.assigned_to || "",
      date_from: parameters.created_after || "",
      date_to: parameters.created_before || "",
    };

    try {
      const result = await leadService.getLeads(
        currentUser,
        page,
        limit,
        filters,
      );

      if (!result.leads || result.leads.length === 0) {
        throw new ApiError("No leads found to score", 404);
      }

      // Score each lead
      const scoredLeads = result.leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        score: this.calculateLeadScore(lead),
        factors: {
          status_value: this.getStatusValue(lead.status),
          has_deal_value: lead.deal_value ? true : false,
          deal_value_amount: lead.deal_value || 0,
          recency_days: this.daysSinceCreated(lead.created_at),
        },
      }));

      // Sort by score descending
      scoredLeads.sort((a, b) => b.score - a.score);

      return {
        scored_leads: scoredLeads,
        count: scoredLeads.length,
        average_score: (
          scoredLeads.reduce((sum, l) => sum + l.score, 0) / scoredLeads.length
        ).toFixed(1),
        summary: `Scored ${scoredLeads.length} leads. Average score: ${(scoredLeads.reduce((sum, l) => sum + l.score, 0) / scoredLeads.length).toFixed(1)}/100`,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to score leads", 500);
    }
  }

  /**
   * Calculate lead score (0-100)
   */
  calculateLeadScore(lead) {
    let score = 50; // Base score

    // Status scoring (0-30 points)
    const statusValue = this.getStatusValue(lead.status);
    score += statusValue * 3; // Up to 30 points

    // Deal value scoring (0-25 points)
    if (lead.deal_value) {
      const dealScore = Math.min(25, (lead.deal_value / 100000) * 25);
      score += dealScore;
    }

    // Recency scoring (0-20 points)
    const daysSince = this.daysSinceCreated(lead.created_at);
    const recencyScore = Math.max(0, 20 - daysSince / 7); // Newer = better
    score += recencyScore;

    // Priority bonus (0-5 points)
    if (lead.priority === "high") {
      score += 5;
    } else if (lead.priority === "medium") {
      score += 2.5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get numeric value for status
   */
  getStatusValue(status) {
    const statusMap = {
      new: 2,
      contacted: 4,
      qualified: 8,
      proposal: 9,
      negotiation: 9.5,
      won: 10,
      lost: 0,
      inactive: 1,
      active: 5,
    };
    return statusMap[status] || 5;
  }

  /**
   * Calculate days since lead was created
   */
  daysSinceCreated(createdAt) {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  /**
   * Create a new task
   */
  async createTask(parameters, currentUser) {
    const taskService = require("./taskService");
    const { supabaseAdmin } = require("../config/supabase");

    let leadId = parameters.lead_id;

    // Try to find lead by name or email if not provided
    if (!leadId && parameters.lead_name) {
      const searchResults = await leadService.searchLeads(
        parameters.lead_name,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    const taskData = {
      company_id: currentUser.company_id,
      assigned_to: currentUser.id,
      created_by: currentUser.id,
      lead_id: leadId || null,
      description: parameters.description || "",
      task_type: parameters.task_type || "follow_up",
      priority: parameters.priority || "medium",
      status: "pending",
      due_date: parameters.due_date || null,
      notes: parameters.notes || "",
    };

    const result = await taskService.createTask(taskData, currentUser);
    return {
      task: result.data,
      action: "created",
      summary: `Task created: "${taskData.description}"`,
    };
  }

  /**
   * List my tasks with filters
   */
  async listMyTasks(parameters, currentUser) {
    const taskService = require("./taskService");

    const filters = {
      assigned_to: currentUser.id,
      status: parameters.status || "",
      priority: parameters.priority || "",
      overdue: parameters.overdue === true ? true : false,
    };

    const tasks = await taskService.getTasks(currentUser, filters);

    return {
      tasks,
      count: tasks.length,
      summary: `You have ${tasks.length} task${tasks.length !== 1 ? "s" : ""}`,
      action: "listed",
    };
  }

  /**
   * Update task status or properties
   */
  async updateTask(parameters, currentUser) {
    const taskService = require("./taskService");

    let taskId = parameters.task_id;

    if (!taskId) {
      throw new ApiError("Task ID is required", 400);
    }

    const updateData = {};

    if (parameters.status) {
      updateData.status = parameters.status;
      if (parameters.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (parameters.priority) {
      updateData.priority = parameters.priority;
    }

    if (parameters.description) {
      updateData.description = parameters.description;
    }

    const result = await taskService.updateTask(
      taskId,
      updateData,
      currentUser,
    );

    return {
      task: result,
      action: "updated",
      summary: `Task ${parameters.status === "completed" ? "marked as complete" : "updated"}`,
    };
  }

  /**
   * Get tasks with filters
   */
  async getTasks(parameters, currentUser) {
    const taskService = require("./taskService");
    const filters = parameters || {};

    try {
      const tasks = await taskService.getTasks(currentUser, filters);
      return { tasks, count: tasks.length };
    } catch (error) {
      console.error("GET_TASKS error:", error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(parameters, currentUser) {
    const taskService = require("./taskService");

    if (!parameters.task_id) {
      throw new ApiError("Task ID is required", 400);
    }

    try {
      const task = await taskService.getTaskById(parameters.task_id);
      return { task, count: 1 };
    } catch (error) {
      console.error("GET_TASK_BY_ID error:", error);
      throw error;
    }
  }

  /**
   * Complete task
   */
  async completeTask(parameters, currentUser) {
    const taskService = require("./taskService");

    if (!parameters.task_id) {
      throw new ApiError("Task ID is required", 400);
    }

    const updateData = {
      status: "completed",
      completed_at: new Date().toISOString(),
    };

    try {
      const task = await taskService.updateTask(
        parameters.task_id,
        updateData,
        currentUser,
      );
      return { task, action: "completed" };
    } catch (error) {
      console.error("COMPLETE_TASK error:", error);
      throw error;
    }
  }

  /**
   * Delete task
   */
  async deleteTask(parameters, currentUser) {
    const taskService = require("./taskService");

    if (!parameters.task_id) {
      throw new ApiError("Task ID is required", 400);
    }

    try {
      const task = await taskService.deleteTask(
        parameters.task_id,
        currentUser,
      );
      return { task, action: "deleted" };
    } catch (error) {
      console.error("DELETE_TASK error:", error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(parameters, currentUser) {
    const taskService = require("./taskService");
    const filters = { ...(parameters || {}), overdue: true };

    try {
      const tasks = await taskService.getTasks(currentUser, filters);
      return { tasks, count: tasks.length };
    } catch (error) {
      console.error("GET_OVERDUE_TASKS error:", error);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(parameters, currentUser) {
    const taskService = require("./taskService");
    const filters = parameters || {};

    try {
      const tasks = await taskService.getTasks(currentUser, filters);

      // Calculate basic stats
      const stats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "completed").length,
        pending: tasks.filter((t) => t.status === "pending").length,
        overdue: tasks.filter(
          (t) => t.status === "pending" && new Date(t.due_date) < new Date(),
        ).length,
      };

      return { stats };
    } catch (error) {
      console.error("GET_TASK_STATS error:", error);
      throw error;
    }
  }

  /**
   * Get tasks by lead ID
   */
  async getTasksByLeadId(parameters, currentUser) {
    const taskService = require("./taskService");

    if (!parameters.lead_id) {
      throw new ApiError("Lead ID is required", 400);
    }

    try {
      const tasks = await taskService.getTasks(currentUser, {
        lead_id: parameters.lead_id,
      });
      return { tasks, count: tasks.length };
    } catch (error) {
      console.error("GET_TASKS_BY_LEAD_ID error:", error);
      throw error;
    }
  }

  /**
   * Log activity (call, email, meeting)
   */
  async logActivity(parameters, currentUser) {
    const activityService = require("./activityService");
    let leadId = parameters.lead_id;

    // Try to find lead by name or email
    if (!leadId && parameters.lead_name) {
      const searchResults = await leadService.searchLeads(
        parameters.lead_name,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError("Could not find the lead to log activity for", 404);
    }

    const activityData = {
      lead_id: leadId,
      user_id: currentUser.id,
      activity_type: parameters.activity_type || "call",
      subject:
        parameters.subject || `${parameters.activity_type || "Call"} with lead`,
      description: parameters.description || "",
      duration_minutes: parameters.duration_minutes || null,
    };

    const result = await activityService.createActivity(
      activityData,
      currentUser,
    );

    return {
      activity: result.data,
      action: "logged",
      summary: `Logged ${activityData.activity_type} activity`,
    };
  }

  /**
   * Get team member statistics
   */
  async getTeamStats(parameters, currentUser) {
    const { supabaseAdmin } = require("../config/supabase");

    // Only managers and admins can view team stats
    if (
      !["company_admin", "super_admin", "manager"].includes(currentUser.role)
    ) {
      throw new ApiError(
        "Access denied. Only managers can view team statistics.",
        403,
      );
    }

    let userName = parameters.user_name || parameters.team_member || "";

    // Find the user
    let { data: users } = await supabaseAdmin
      .from("user_profiles")
      .select("id, first_name, last_name, role")
      .eq("company_id", currentUser.company_id);

    let targetUser = users?.find(
      (u) =>
        u.first_name.toLowerCase().includes(userName.toLowerCase()) ||
        u.last_name.toLowerCase().includes(userName.toLowerCase()),
    );

    if (!targetUser && userName) {
      throw new ApiError(`Team member "${userName}" not found`, 404);
    }

    if (!targetUser) {
      throw new ApiError("Please specify a team member name", 400);
    }

    // Get stats for the user
    const { data: leadsData } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("company_id", currentUser.company_id)
      .eq("assigned_to", targetUser.id);

    const { data: activitiesData } = await supabaseAdmin
      .from("activities")
      .select("*")
      .eq("company_id", currentUser.company_id)
      .eq("user_id", targetUser.id);

    const { data: tasksData } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("company_id", currentUser.company_id)
      .eq("assigned_to", targetUser.id);

    const leads = leadsData || [];
    const activities = activitiesData || [];
    const tasks = tasksData || [];

    return {
      user: `${targetUser.first_name} ${targetUser.last_name}`,
      stats: {
        total_leads: leads.length,
        active_leads: leads.filter(
          (l) => l.status !== "won" && l.status !== "lost",
        ).length,
        won_leads: leads.filter((l) => l.status === "won").length,
        total_activities: activities.length,
        pending_tasks: tasks.filter((t) => t.status !== "completed").length,
        completed_tasks: tasks.filter((t) => t.status === "completed").length,
      },
    };
  }

  /**
   * Get my personal statistics
   */
  async getMyStats(parameters, currentUser) {
    const { supabaseAdmin } = require("../config/supabase");

    // Get stats for current user
    const { data: leadsData } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("company_id", currentUser.company_id)
      .eq("assigned_to", currentUser.id);

    const { data: activitiesData } = await supabaseAdmin
      .from("activities")
      .select("*")
      .eq("company_id", currentUser.company_id)
      .eq("user_id", currentUser.id);

    const { data: tasksData } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("company_id", currentUser.company_id)
      .eq("assigned_to", currentUser.id);

    const leads = leadsData || [];
    const activities = activitiesData || [];
    const tasks = tasksData || [];

    return {
      stats: {
        total_leads: leads.length,
        active_leads: leads.filter(
          (l) => l.status !== "won" && l.status !== "lost",
        ).length,
        won_leads: leads.filter((l) => l.status === "won").length,
        lost_leads: leads.filter((l) => l.status === "lost").length,
        total_activities: activities.length,
        calls_logged: activities.filter((a) => a.activity_type === "call")
          .length,
        emails_logged: activities.filter((a) => a.activity_type === "email")
          .length,
        meetings_logged: activities.filter((a) => a.activity_type === "meeting")
          .length,
        pending_tasks: tasks.filter((t) => t.status !== "completed").length,
        completed_tasks: tasks.filter((t) => t.status === "completed").length,
      },
      summary: `Leads: ${leads.length} (${leads.filter((l) => l.status === "won").length} won) | Activities: ${activities.length} | Pending Tasks: ${tasks.filter((t) => t.status !== "completed").length}`,
    };
  }

  /**
   * Bulk update leads with preview
   */
  async bulkUpdateLeads(parameters, currentUser) {
    const page = 1;
    const limit = 1000;

    const filters = {
      status: parameters.filter_status || "",
      source: parameters.filter_source || "",
      assigned_to: parameters.filter_assigned_to || "",
    };

    const result = await leadService.getLeads(
      currentUser,
      page,
      limit,
      filters,
    );
    const matchingLeads = result.leads || [];

    if (matchingLeads.length === 0) {
      throw new ApiError("No leads match the filter criteria", 404);
    }

    // Prepare update data
    const updateData = {};
    if (parameters.update_status) updateData.status = parameters.update_status;
    if (parameters.update_priority)
      updateData.priority = parameters.update_priority;
    if (parameters.update_source) updateData.source = parameters.update_source;

    return {
      preview: {
        matching_count: matchingLeads.length,
        sample_leads: matchingLeads
          .slice(0, 5)
          .map((l) => ({ id: l.id, name: l.name, email: l.email })),
        updates: updateData,
      },
      action: "preview_ready",
      summary: `Found ${matchingLeads.length} leads that match your criteria. Ready to update their ${Object.keys(updateData).join(", ")}.`,
    };
  }

  /**
   * Bulk assign leads with distribution preview
   */
  async bulkAssignLeads(parameters, currentUser) {
    const { supabaseAdmin } = require("../config/supabase");
    const page = 1;
    const limit = 1000;

    const filters = {
      status: parameters.filter_status || "",
      source: parameters.filter_source || "",
      assigned_to: parameters.filter_assigned_to || "",
    };

    const result = await leadService.getLeads(
      currentUser,
      page,
      limit,
      filters,
    );
    const matchingLeads = result.leads || [];

    if (matchingLeads.length === 0) {
      throw new ApiError("No leads match the filter criteria", 404);
    }

    // Find target user
    const assignTo = parameters.assign_to || "";
    if (!assignTo) {
      throw new ApiError("Please specify who to assign leads to", 400);
    }

    const { data: users } = await supabaseAdmin
      .from("user_profiles")
      .select("id, first_name, last_name")
      .eq("company_id", currentUser.company_id);

    const targetUser = users?.find(
      (u) =>
        u.first_name.toLowerCase().includes(assignTo.toLowerCase()) ||
        u.last_name.toLowerCase().includes(assignTo.toLowerCase()),
    );

    if (!targetUser) {
      throw new ApiError(`Team member "${assignTo}" not found`, 404);
    }

    // Get current workload
    const { data: assignmentCounts } = await supabaseAdmin
      .from("leads")
      .select("assigned_to")
      .eq("company_id", currentUser.company_id)
      .eq("assigned_to", targetUser.id);

    return {
      preview: {
        matching_count: matchingLeads.length,
        assign_to: `${targetUser.first_name} ${targetUser.last_name}`,
        target_workload: assignmentCounts?.length || 0,
        sample_leads: matchingLeads
          .slice(0, 5)
          .map((l) => ({ id: l.id, name: l.name, email: l.email })),
      },
      action: "preview_ready",
      summary: `Will assign ${matchingLeads.length} leads to ${targetUser.first_name} ${targetUser.last_name} (current workload: ${assignmentCounts?.length || 0} leads).`,
    };
  }

  /**
   * Group and analyze leads by criteria
   */
  async groupByAnalysis(parameters, currentUser) {
    const page = 1;
    const limit = 1000;

    const filters = {
      status: parameters.status || "",
      source: parameters.source || "",
    };

    const result = await leadService.getLeads(
      currentUser,
      page,
      limit,
      filters,
    );
    const leads = result.leads || [];

    const groupBy = parameters.group_by || "source";
    const grouped = {};

    leads.forEach((lead) => {
      let key = "unknown";

      if (groupBy === "source") {
        key = lead.lead_source || "unknown";
      } else if (groupBy === "status") {
        key = lead.status || "unknown";
      } else if (groupBy === "company") {
        key = lead.company || "unassigned";
      } else if (groupBy === "priority") {
        key = lead.priority || "medium";
      }

      if (!grouped[key]) {
        grouped[key] = { count: 0, examples: [] };
      }
      grouped[key].count++;
      if (grouped[key].examples.length < 3) {
        grouped[key].examples.push(lead.name);
      }
    });

    // Sort by count descending
    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, data]) => ({
        category: key,
        count: data.count,
        examples: data.examples,
      }));

    return {
      group_by: groupBy,
      results: sorted,
      total_leads: leads.length,
      summary: `Leads grouped by ${groupBy}: ${sorted.map((r) => `${r.category} (${r.count})`).join(", ")}`,
    };
  }

  /**
   * Schedule a recurring report
   */
  async scheduleReport(parameters, currentUser) {
    // In production, this would create a database record and set up a scheduler
    // For now, return the scheduling confirmation

    const frequency = parameters.frequency || "daily";
    const reportType = parameters.report_type || "all_leads";
    const time = parameters.time || "09:00";

    return {
      scheduled: true,
      frequency,
      report_type: reportType,
      send_time: time,
      summary: `Scheduled a ${frequency} ${reportType} report to be sent at ${time}.`,
    };
  }

  /**
   * Create a reminder for follow-ups
   */
  async createReminder(parameters, currentUser) {
    const taskService = require("./taskService");
    let leadId = parameters.lead_id;

    // Try to find lead by name
    if (!leadId && parameters.lead_name) {
      const searchResults = await leadService.searchLeads(
        parameters.lead_name,
        1,
        currentUser,
      );
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    const daysFromNow = parameters.days_from_now || 1;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);

    const taskData = {
      company_id: currentUser.company_id,
      assigned_to: currentUser.id,
      created_by: currentUser.id,
      lead_id: leadId || null,
      description: parameters.reminder_text || `Follow up reminder`,
      task_type: "reminder",
      priority: parameters.priority || "medium",
      status: "pending",
      due_date: dueDate.toISOString().split("T")[0],
      notes: "",
    };

    const result = await taskService.createTask(taskData, currentUser);

    return {
      reminder: result.data,
      created_at: new Date().toISOString(),
      due_date: taskData.due_date,
      summary: `Reminder created for ${daysFromNow} day${daysFromNow > 1 ? "s" : ""} from now: "${parameters.reminder_text}"`,
    };
  }

  // ===== ACTIVITY MODULE IMPLEMENTATIONS =====

  /**
   * Get activities with filters
   */
  async getActivities(parameters, currentUser) {
    const controller = require("../controllers/activityController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getActivities(req, res, next);
      return { activities: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_ACTIVITIES error:", error);
      throw error;
    }
  }

  /**
   * Create a new activity
   */
  async createActivity(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    // Extract activity data from parameters
    const activityData = {
      company_id: currentUser.company_id,
      lead_id: parameters.lead_id || null,
      user_id: currentUser.id,
      activity_type: parameters.activity_type || "call",
      description: parameters.description || "",
      outcome: parameters.outcome || null,
      scheduled_at: parameters.scheduled_at || null,
      completed_at: parameters.completed_at || null,
      metadata: parameters.metadata || {},
    };

    // If description is missing, construct from type
    if (!activityData.description) {
      const type = activityData.activity_type;
      const leadName = parameters.lead_name || parameters.lead_email || "";
      activityData.description = `Logged ${type} ${leadName ? `with ${leadName}` : ""}`;
    }

    const req = { body: activityData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createActivity(req, res, next);
      return { activity: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_ACTIVITY error:", error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(parameters, currentUser) {
    const controller = require("../controllers/activityController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getActivityStats(req, res, next);
      return { stats: result.data || {} };
    } catch (error) {
      console.error("GET_ACTIVITY_STATS error:", error);
      throw error;
    }
  }

  /**
   * Get team timeline
   */
  async getTeamTimeline(parameters, currentUser) {
    const controller = require("../controllers/activityController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getTeamTimeline(req, res, next);
      return { timeline: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_TEAM_TIMELINE error:", error);
      throw error;
    }
  }

  /**
   * Complete an activity
   */
  async completeActivity(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (!parameters.activity_id) {
      throw new ApiError("Activity ID is required", 400);
    }

    const updateData = {
      completed_at: new Date().toISOString(),
    };

    if (parameters.outcome) {
      updateData.outcome = parameters.outcome;
    }

    const req = {
      params: { id: parameters.activity_id },
      body: updateData,
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.updateActivity(req, res, next);
      return { activity: result.data, action: "completed" };
    } catch (error) {
      console.error("COMPLETE_ACTIVITY error:", error);
      throw error;
    }
  }

  // ===== REMAINING ACTIVITY MODULE IMPLEMENTATIONS =====

  /**
   * Get activity by ID
   */
  async getActivityById(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (!parameters.activity_id) {
      throw new ApiError("Activity ID is required", 400);
    }

    const req = {
      params: { id: parameters.activity_id },
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getActivityById(req, res, next);
      return { activity: result.data, count: 1 };
    } catch (error) {
      console.error("GET_ACTIVITY_BY_ID error:", error);
      throw error;
    }
  }

  /**
   * Get lead timeline
   */
  async getLeadTimeline(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getLeadTimeline(req, res, next);
      return { timeline: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_LEAD_TIMELINE error:", error);
      throw error;
    }
  }

  /**
   * Get lead activities
   */
  async getLeadActivities(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getLeadActivities(req, res, next);
      return { activities: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_LEAD_ACTIVITIES error:", error);
      throw error;
    }
  }

  /**
   * Get user activities
   */
  async getUserActivities(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (!parameters.user_id) {
      parameters.user_id = currentUser.id;
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getUserActivities(req, res, next);
      return { activities: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_USER_ACTIVITIES error:", error);
      throw error;
    }
  }

  /**
   * Create bulk activities
   */
  async createBulkActivities(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (!parameters.activities || !Array.isArray(parameters.activities)) {
      throw new ApiError("Activities array is required", 400);
    }

    // Add company_id and user_id to each activity
    const activitiesWithContext = parameters.activities.map((activity) => ({
      ...activity,
      company_id: currentUser.company_id,
      user_id: currentUser.id,
    }));

    const req = {
      body: { activities: activitiesWithContext },
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createBulkActivities(req, res, next);
      return {
        activities: result.data || [],
        count: result.data?.length || 0,
        action: "bulk_created",
      };
    } catch (error) {
      console.error("CREATE_BULK_ACTIVITIES error:", error);
      throw error;
    }
  }

  /**
   * Update activity
   */
  async updateActivity(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (!parameters.activity_id) {
      throw new ApiError("Activity ID is required", 400);
    }

    const req = {
      params: { id: parameters.activity_id },
      body: parameters,
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.updateActivity(req, res, next);
      return { activity: result.data, action: "updated" };
    } catch (error) {
      console.error("UPDATE_ACTIVITY error:", error);
      throw error;
    }
  }

  /**
   * Delete activity
   */
  async deleteActivity(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (!parameters.activity_id) {
      throw new ApiError("Activity ID is required", 400);
    }

    const req = {
      params: { id: parameters.activity_id },
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.deleteActivity(req, res, next);
      return { activity: result.data, action: "deleted" };
    } catch (error) {
      console.error("DELETE_ACTIVITY error:", error);
      throw error;
    }
  }

  /**
   * Get lead timeline summary
   */
  async getLeadTimelineSummary(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getLeadTimelineSummary(req, res, next);
      return { summary: result.data || {} };
    } catch (error) {
      console.error("GET_LEAD_TIMELINE_SUMMARY error:", error);
      throw error;
    }
  }

  /**
   * Get user timeline
   */
  async getUserTimeline(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    if (!parameters.user_id) {
      parameters.user_id = currentUser.id;
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getUserTimeline(req, res, next);
      return { timeline: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_USER_TIMELINE error:", error);
      throw error;
    }
  }

  /**
   * Get activity trends
   */
  async getActivityTrends(parameters, currentUser) {
    const controller = require("../controllers/activityController");

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getActivityTrends(req, res, next);
      return { trends: result.data || {} };
    } catch (error) {
      console.error("GET_ACTIVITY_TRENDS error:", error);
      throw error;
    }
  }

  // ===== ASSIGNMENT MODULE IMPLEMENTATIONS =====

  /**
   * Get team workload
   */
  async getTeamWorkload(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getTeamWorkload(req, res, next);
      return { workload: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_TEAM_WORKLOAD error:", error);
      throw error;
    }
  }

  /**
   * Auto assign lead
   */
  async autoAssignLead(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.autoAssignLead(req, res, next);
      return { lead: result.data, action: "auto_assigned" };
    } catch (error) {
      console.error("AUTO_ASSIGN_LEAD error:", error);
      throw error;
    }
  }

  /**
   * Create assignment rule
   */
  async createAssignmentRule(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");
    const ruleData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: ruleData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createRule(req, res, next);
      return { rule: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_ASSIGNMENT_RULE error:", error);
      throw error;
    }
  }

  /**
   * Get assignment recommendations
   */
  async getAssignmentRecommendations(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getAssignmentRecommendations(
        req,
        res,
        next,
      );
      return {
        recommendations: result.data || [],
        count: result.data?.length || 0,
      };
    } catch (error) {
      console.error("GET_ASSIGNMENT_RECOMMENDATIONS error:", error);
      throw error;
    }
  }

  /**
   * Redistribute leads
   */
  async redistributeLeads(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");

    if (!parameters.user_ids || !Array.isArray(parameters.user_ids)) {
      throw new ApiError("User IDs array is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.redistributeLeads(req, res, next);
      return {
        redistributed: result.data || [],
        count: result.data?.length || 0,
        action: "redistributed",
      };
    } catch (error) {
      console.error("REDISTRIBUTE_LEADS error:", error);
      throw error;
    }
  }

  /**
   * Reassign lead
   */
  async reassignLead(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    if (!parameters.assign_to) {
      throw new ApiError("Assignee is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.reassignLead(req, res, next);
      return { lead: result.data, action: "reassigned" };
    } catch (error) {
      console.error("REASSIGN_LEAD error:", error);
      throw error;
    }
  }

  /**
   * Get assignment stats
   */
  async getAssignmentStats(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getAssignmentStats(req, res, next);
      return { stats: result.data || {} };
    } catch (error) {
      console.error("GET_ASSIGNMENT_STATS error:", error);
      throw error;
    }
  }

  /**
   * Get assignment history
   */
  async getAssignmentHistory(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getLeadAssignmentHistory(req, res, next);
      return { history: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_ASSIGNMENT_HISTORY error:", error);
      throw error;
    }
  }

  /**
   * Get active rules
   */
  async getActiveRules(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");
    const req = {
      query: { ...(parameters || {}), active_only: true },
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getActiveRules(req, res, next);
      return { rules: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_ACTIVE_RULES error:", error);
      throw error;
    }
  }

  /**
   * Get routing stats
   */
  async getRoutingStats(parameters, currentUser) {
    const controller = require("../controllers/assignmentController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getRoutingStats(req, res, next);
      return { stats: result.data || {} };
    } catch (error) {
      console.error("GET_ROUTING_STATS error:", error);
      throw error;
    }
  }

  // ===== PIPELINE MODULE IMPLEMENTATIONS =====

  /**
   * Get all pipeline stages
   */
  async getStages(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getStages(req, res, next);
      return { stages: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_STAGES error:", error);
      throw error;
    }
  }

  /**
   * Create new pipeline stage
   */
  async createStage(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");

    if (!parameters.name) {
      throw new ApiError("Stage name is required", 400);
    }

    const stageData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: stageData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createStage(req, res, next);
      return { stage: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_STAGE error:", error);
      throw error;
    }
  }

  /**
   * Update pipeline stage
   */
  async updateStage(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");

    if (!parameters.stage_id) {
      throw new ApiError("Stage ID is required", 400);
    }

    const req = {
      params: { id: parameters.stage_id },
      body: parameters,
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.updateStage(req, res, next);
      return { stage: result.data, action: "updated" };
    } catch (error) {
      console.error("UPDATE_STAGE error:", error);
      throw error;
    }
  }

  /**
   * Delete pipeline stage
   */
  async deleteStage(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");

    if (!parameters.stage_id) {
      throw new ApiError("Stage ID is required", 400);
    }

    const req = {
      params: { id: parameters.stage_id },
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.deleteStage(req, res, next);
      return { stage: result.data, action: "deleted" };
    } catch (error) {
      console.error("DELETE_STAGE error:", error);
      throw error;
    }
  }

  /**
   * Reorder pipeline stages
   */
  async reorderStages(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");

    if (!parameters.stage_orders || !Array.isArray(parameters.stage_orders)) {
      throw new ApiError("Stage orders array is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.reorderStages(req, res, next);
      return { stages: result.data || [], action: "reordered" };
    } catch (error) {
      console.error("REORDER_STAGES error:", error);
      throw error;
    }
  }

  /**
   * Get pipeline overview
   */
  async getPipelineOverview(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getPipelineOverview(req, res, next);
      return { overview: result.data || {} };
    } catch (error) {
      console.error("GET_PIPELINE_OVERVIEW error:", error);
      throw error;
    }
  }

  /**
   * Move lead to stage
   */
  async moveLeadToStage(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    if (!parameters.stage_id && !parameters.stage_name) {
      throw new ApiError("Stage identifier is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.moveLeadToStage(req, res, next);
      return { lead: result.data, action: "moved" };
    } catch (error) {
      console.error("MOVE_LEAD_TO_STAGE error:", error);
      throw error;
    }
  }

  /**
   * Get conversion rates
   */
  async getConversionRates(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getConversionRates(req, res, next);
      return { rates: result.data || {} };
    } catch (error) {
      console.error("GET_CONVERSION_RATES error:", error);
      throw error;
    }
  }

  /**
   * Create default stages
   */
  async createDefaultStages(parameters, currentUser) {
    const controller = require("../controllers/pipelineController");

    const stageData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: stageData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createDefaultStages(req, res, next);
      return {
        stages: result.data || [],
        count: result.data?.length || 0,
        action: "created",
      };
    } catch (error) {
      console.error("CREATE_DEFAULT_STAGES error:", error);
      throw error;
    }
  }

  // ===== EMAIL SYSTEM IMPLEMENTATIONS =====

  // ===== EmailSend Module (7 actions) =====

  /**
   * Send email to a lead
   */
  async sendToLead(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    if (!parameters.template_id && !parameters.subject && !parameters.body) {
      throw new ApiError(
        "Email content (template_id or subject/body) is required",
        400,
      );
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.sendToLead(req, res, next);
      return { email: result.data, action: "sent" };
    } catch (error) {
      console.error("SEND_TO_LEAD error:", error);
      throw error;
    }
  }

  /**
   * Send email to specific email address
   */
  async sendToEmail(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.to) {
      throw new ApiError("Recipient email address is required", 400);
    }

    if (!parameters.template_id && !parameters.subject && !parameters.body) {
      throw new ApiError(
        "Email content (template_id or subject/body) is required",
        400,
      );
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.sendToEmail(req, res, next);
      return { email: result.data, action: "sent" };
    } catch (error) {
      console.error("SEND_TO_EMAIL error:", error);
      throw error;
    }
  }

  /**
   * Get sent emails
   */
  async getSentEmails(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getSentEmails(req, res, next);
      return { emails: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_SENT_EMAILS error:", error);
      throw error;
    }
  }

  /**
   * Get email details by ID
   */
  async getEmailDetails(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.email_id) {
      throw new ApiError("Email ID is required", 400);
    }

    const req = { params: { id: parameters.email_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getEmailDetails(req, res, next);
      return { email: result.data };
    } catch (error) {
      console.error("GET_EMAIL_DETAILS error:", error);
      throw error;
    }
  }

  /**
   * Get suppression list
   */
  async getSuppressionList(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getSuppressionList(req, res, next);
      return { suppressions: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_SUPPRESSION_LIST error:", error);
      throw error;
    }
  }

  /**
   * Add email to suppression list
   */
  async addToSuppressionList(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.email && !parameters.reason) {
      throw new ApiError("Email and reason are required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.addToSuppressionList(req, res, next);
      return { suppression: result.data, action: "added" };
    } catch (error) {
      console.error("ADD_TO_SUPPRESSION_LIST error:", error);
      throw error;
    }
  }

  /**
   * Remove email from suppression list
   */
  async removeFromSuppressionList(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.email) {
      throw new ApiError("Email is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.removeFromSuppressionList(req, res, next);
      return { suppression: result.data, action: "removed" };
    } catch (error) {
      console.error("REMOVE_FROM_SUPPRESSION_LIST error:", error);
      throw error;
    }
  }

  // ===== EmailTemplate Module (12 actions) =====

  /**
   * Get email templates
   */
  async getTemplates(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getTemplates(req, res, next);
      return { templates: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_TEMPLATES error:", error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    const req = { params: { id: parameters.template_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getTemplateById(req, res, next);
      return { template: result.data };
    } catch (error) {
      console.error("GET_TEMPLATE_BY_ID error:", error);
      throw error;
    }
  }

  /**
   * Create email template
   */
  async createTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.name) {
      throw new ApiError("Template name is required", 400);
    }

    if (!parameters.subject && !parameters.html_content) {
      throw new ApiError(
        "Template content (subject or html_content) is required",
        400,
      );
    }

    const templateData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: templateData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createTemplate(req, res, next);
      return { template: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Update email template
   */
  async updateTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    const req = {
      params: { id: parameters.template_id },
      body: parameters,
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.updateTemplate(req, res, next);
      return { template: result.data, action: "updated" };
    } catch (error) {
      console.error("UPDATE_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Delete email template
   */
  async deleteTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    const req = { params: { id: parameters.template_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.deleteTemplate(req, res, next);
      return { template: result.data, action: "deleted" };
    } catch (error) {
      console.error("DELETE_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Create template version
   */
  async createVersion(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    if (!parameters.content) {
      throw new ApiError("Version content is required", 400);
    }

    const versionData = {
      ...parameters,
      created_by: currentUser.id,
    };

    const req = { body: versionData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createVersion(req, res, next);
      return { version: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_VERSION error:", error);
      throw error;
    }
  }

  /**
   * Publish template version
   */
  async publishVersion(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id && !parameters.version_id) {
      throw new ApiError("Template ID or version ID is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.publishVersion(req, res, next);
      return { version: result.data, action: "published" };
    } catch (error) {
      console.error("PUBLISH_VERSION error:", error);
      throw error;
    }
  }

  /**
   * Compile MJML template
   */
  async compileMjml(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.mjml) {
      throw new ApiError("MJML content is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.compileMjml(req, res, next);
      return { html: result.data };
    } catch (error) {
      console.error("COMPILE_MJML error:", error);
      throw error;
    }
  }

  /**
   * Preview template
   */
  async previewTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id && !parameters.html_content) {
      throw new ApiError("Template ID or HTML content is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.previewTemplate(req, res, next);
      return { preview: result.data };
    } catch (error) {
      console.error("PREVIEW_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Get template folders
   */
  async getFolders(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getFolders(req, res, next);
      return { folders: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_FOLDERS error:", error);
      throw error;
    }
  }

  /**
   * Get integration settings
   */
  async getIntegrationSettings(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getIntegrationSettings(req, res, next);
      return { settings: result.data || {} };
    } catch (error) {
      console.error("GET_INTEGRATION_SETTINGS error:", error);
      throw error;
    }
  }

  /**
   * Upsert integration settings
   */
  async upsertIntegrationSettings(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.provider) {
      throw new ApiError("Email provider is required", 400);
    }

    const settingsData = {
      ...parameters,
      company_id: currentUser.company_id,
      updated_by: currentUser.id,
    };

    const req = { body: settingsData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.upsertIntegrationSettings(req, res, next);
      return { settings: result.data, action: "saved" };
    } catch (error) {
      console.error("UPSERT_INTEGRATION_SETTINGS error:", error);
      throw error;
    }
  }

  // ===== Automation Module (9 actions) =====

  /**
   * Get email sequences
   */
  async getSequences(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getSequences(req, res, next);
      return { sequences: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_SEQUENCES error:", error);
      throw error;
    }
  }

  /**
   * Get sequence by ID
   */
  async getSequenceById(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.sequence_id) {
      throw new ApiError("Sequence ID is required", 400);
    }

    const req = { params: { id: parameters.sequence_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getSequenceById(req, res, next);
      return { sequence: result.data };
    } catch (error) {
      console.error("GET_SEQUENCE_BY_ID error:", error);
      throw error;
    }
  }

  /**
   * Create email sequence
   */
  async createSequence(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.name) {
      throw new ApiError("Sequence name is required", 400);
    }

    if (
      !parameters.steps ||
      !Array.isArray(parameters.steps) ||
      parameters.steps.length === 0
    ) {
      throw new ApiError("Sequence steps are required", 400);
    }

    const sequenceData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: sequenceData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createSequence(req, res, next);
      return { sequence: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_SEQUENCE error:", error);
      throw error;
    }
  }

  /**
   * Update email sequence
   */
  async updateSequence(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.sequence_id) {
      throw new ApiError("Sequence ID is required", 400);
    }

    const req = {
      params: { id: parameters.sequence_id },
      body: parameters,
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.updateSequence(req, res, next);
      return { sequence: result.data, action: "updated" };
    } catch (error) {
      console.error("UPDATE_SEQUENCE error:", error);
      throw error;
    }
  }

  /**
   * Delete email sequence
   */
  async deleteSequence(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.sequence_id) {
      throw new ApiError("Sequence ID is required", 400);
    }

    const req = { params: { id: parameters.sequence_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.deleteSequence(req, res, next);
      return { sequence: result.data, action: "deleted" };
    } catch (error) {
      console.error("DELETE_SEQUENCE error:", error);
      throw error;
    }
  }

  /**
   * Enroll lead in sequence
   */
  async enrollLead(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.sequence_id) {
      throw new ApiError("Sequence ID is required", 400);
    }

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.enrollLead(req, res, next);
      return { enrollment: result.data, action: "enrolled" };
    } catch (error) {
      console.error("ENROLL_LEAD error:", error);
      throw error;
    }
  }

  /**
   * Unenroll lead from sequence
   */
  async unenrollLead(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.sequence_id) {
      throw new ApiError("Sequence ID is required", 400);
    }

    if (
      !parameters.lead_id &&
      !parameters.lead_email &&
      !parameters.lead_name
    ) {
      throw new ApiError("Lead identifier is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.unenrollLead(req, res, next);
      return { enrollment: result.data, action: "unenrolled" };
    } catch (error) {
      console.error("UNENROLL_LEAD error:", error);
      throw error;
    }
  }

  /**
   * Get sequence enrollments
   */
  async getEnrollments(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.sequence_id) {
      throw new ApiError("Sequence ID is required", 400);
    }

    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getEnrollments(req, res, next);
      return { enrollments: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_ENROLLMENTS error:", error);
      throw error;
    }
  }

  /**
   * Process due enrollments
   */
  async processDueEnrollments(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.processDueEnrollments(req, res, next);
      return {
        processed: result.data || [],
        count: result.processedCount || 0,
      };
    } catch (error) {
      console.error("PROCESS_DUE_ENROLLMENTS error:", error);
      throw error;
    }
  }

  // ===== WorkflowTemplate Module (10 actions) =====

  /**
   * Get workflow templates
   */
  async getWorkflowTemplates(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getWorkflowTemplates(req, res, next);
      return { templates: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_WORKFLOW_TEMPLATES error:", error);
      throw error;
    }
  }

  /**
   * Get workflow template by ID
   */
  async getWorkflowTemplateById(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    const req = { params: { id: parameters.template_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getWorkflowTemplateById(req, res, next);
      return { template: result.data };
    } catch (error) {
      console.error("GET_WORKFLOW_TEMPLATE_BY_ID error:", error);
      throw error;
    }
  }

  /**
   * Create workflow template
   */
  async createWorkflowTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.name) {
      throw new ApiError("Template name is required", 400);
    }

    if (!parameters.workflow_data) {
      throw new ApiError("Workflow data is required", 400);
    }

    const templateData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: templateData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createWorkflowTemplate(req, res, next);
      return { template: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_WORKFLOW_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Create sequence from template
   */
  async createSequenceFromTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    if (!parameters.name) {
      throw new ApiError("Sequence name is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createSequenceFromTemplate(
        req,
        res,
        next,
      );
      return { sequence: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_SEQUENCE_FROM_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Update workflow template
   */
  async updateWorkflowTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    const req = {
      params: { id: parameters.template_id },
      body: parameters,
      user: currentUser,
    };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.updateWorkflowTemplate(req, res, next);
      return { template: result.data, action: "updated" };
    } catch (error) {
      console.error("UPDATE_WORKFLOW_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Delete workflow template
   */
  async deleteWorkflowTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    const req = { params: { id: parameters.template_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.deleteWorkflowTemplate(req, res, next);
      return { template: result.data, action: "deleted" };
    } catch (error) {
      console.error("DELETE_WORKFLOW_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Export workflow template
   */
  async exportWorkflowTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_id) {
      throw new ApiError("Template ID is required", 400);
    }

    const req = { params: { id: parameters.template_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.exportWorkflowTemplate(req, res, next);
      return { export: result.data };
    } catch (error) {
      console.error("EXPORT_WORKFLOW_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Import workflow template
   */
  async importWorkflowTemplate(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.template_data) {
      throw new ApiError("Template data is required", 400);
    }

    if (!parameters.name) {
      throw new ApiError("Template name is required", 400);
    }

    const importData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: importData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.importWorkflowTemplate(req, res, next);
      return { template: result.data, action: "imported" };
    } catch (error) {
      console.error("IMPORT_WORKFLOW_TEMPLATE error:", error);
      throw error;
    }
  }

  /**
   * Get template packs
   */
  async getTemplatePacks(parameters, currentUser) {
    const controller = require("../controllers/emailController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getTemplatePacks(req, res, next);
      return { packs: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_TEMPLATE_PACKS error:", error);
      throw error;
    }
  }

  /**
   * Get pack by ID
   */
  async getPackById(parameters, currentUser) {
    const controller = require("../controllers/emailController");

    if (!parameters.pack_id) {
      throw new ApiError("Pack ID is required", 400);
    }

    const req = { params: { id: parameters.pack_id }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getPackById(req, res, next);
      return { pack: result.data };
    } catch (error) {
      console.error("GET_PACK_BY_ID error:", error);
      throw error;
    }
  }

  // ===== WEEK 4: FINAL MODULES IMPLEMENTATIONS =====

  // ===== Import/Export Module (8 actions) =====

  /**
   * Import leads from file
   */
  async importLeads(parameters, currentUser) {
    const controller = require("../controllers/importController");

    if (!parameters.file_path && !parameters.file_data) {
      throw new ApiError("File path or file data is required", 400);
    }

    if (!parameters.mapping || typeof parameters.mapping !== "object") {
      throw new ApiError("Field mapping is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.importLeads(req, res, next);
      return {
        import: result.data,
        imported: result.importedCount || 0,
        errors: result.errors || [],
        action: "imported",
      };
    } catch (error) {
      console.error("IMPORT_LEADS error:", error);
      throw error;
    }
  }

  /**
   * Dry run import leads
   */
  async dryRunLeads(parameters, currentUser) {
    const controller = require("../controllers/importController");

    if (!parameters.file_path && !parameters.file_data) {
      throw new ApiError("File path or file data is required", 400);
    }

    if (!parameters.mapping || typeof parameters.mapping !== "object") {
      throw new ApiError("Field mapping is required", 400);
    }

    const req = { body: { ...parameters, dry_run: true }, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.importLeads(req, res, next);
      return {
        preview: result.data,
        valid: result.validCount || 0,
        invalid: result.invalidCount || 0,
        errors: result.errors || [],
      };
    } catch (error) {
      console.error("DRY_RUN_LEADS error:", error);
      throw error;
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(parameters, currentUser) {
    const controller = require("../controllers/importController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getImportHistory(req, res, next);
      return { history: result.data || [], count: result.totalItems || 0 };
    } catch (error) {
      console.error("GET_IMPORT_HISTORY error:", error);
      throw error;
    }
  }

  /**
   * Validate import file
   */
  async validateImportFile(parameters, currentUser) {
    const controller = require("../controllers/importController");

    if (!parameters.file_path && !parameters.file_data) {
      throw new ApiError("File path or file data is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.validateImportFile(req, res, next);
      return {
        valid: result.data?.valid || false,
        errors: result.data?.errors || [],
        warnings: result.data?.warnings || [],
      };
    } catch (error) {
      console.error("VALIDATE_IMPORT_FILE error:", error);
      throw error;
    }
  }

  /**
   * Convert data to CSV
   */
  async convertToCsv(parameters, currentUser) {
    const controller = require("../controllers/importController");

    if (!parameters.data || !Array.isArray(parameters.data)) {
      throw new ApiError("Data array is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.convertToCsv(req, res, next);
      return { csv: result.data };
    } catch (error) {
      console.error("CONVERT_TO_CSV error:", error);
      throw error;
    }
  }

  /**
   * Convert data to Excel
   */
  async convertToExcel(parameters, currentUser) {
    const controller = require("../controllers/importController");

    if (!parameters.data || !Array.isArray(parameters.data)) {
      throw new ApiError("Data array is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.convertToExcel(req, res, next);
      return { excel: result.data };
    } catch (error) {
      console.error("CONVERT_TO_EXCEL error:", error);
      throw error;
    }
  }

  /**
   * Get suggested field mappings
   */
  async getSuggestedMappings(parameters, currentUser) {
    const controller = require("../controllers/importController");

    if (!parameters.headers || !Array.isArray(parameters.headers)) {
      throw new ApiError("Headers array is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getSuggestedMappings(req, res, next);
      return { mappings: result.data || {} };
    } catch (error) {
      console.error("GET_SUGGESTED_MAPPINGS error:", error);
      throw error;
    }
  }

  /**
   * Get upload middleware configuration
   */
  async getUploadMiddleware(parameters, currentUser) {
    const controller = require("../controllers/importController");
    const req = { query: parameters || {}, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getUploadMiddleware(req, res, next);
      return { middleware: result.data || {} };
    } catch (error) {
      console.error("GET_UPLOAD_MIDDLEWARE error:", error);
      throw error;
    }
  }

  // ===== Auth Module (6 actions) =====

  /**
   * Register new user
   */
  async register(parameters, currentUser) {
    const controller = require("../controllers/authController");

    if (!parameters.email) {
      throw new ApiError("Email is required", 400);
    }

    if (!parameters.password) {
      throw new ApiError("Password is required", 400);
    }

    if (!parameters.first_name || !parameters.last_name) {
      throw new ApiError("First name and last name are required", 400);
    }

    if (!parameters.company_name) {
      throw new ApiError("Company name is required", 400);
    }

    const req = { body: parameters };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.register(req, res, next);
      return { user: result.data, action: "registered" };
    } catch (error) {
      console.error("REGISTER error:", error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(parameters, currentUser) {
    const controller = require("../controllers/authController");

    if (!parameters.email) {
      throw new ApiError("Email is required", 400);
    }

    if (!parameters.password) {
      throw new ApiError("Password is required", 400);
    }

    const req = { body: parameters };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.login(req, res, next);
      return {
        user: result.data?.user,
        token: result.data?.token,
        action: "logged_in",
      };
    } catch (error) {
      console.error("LOGIN error:", error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(parameters, currentUser) {
    const controller = require("../controllers/authController");
    const req = { user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.getProfile(req, res, next);
      return { profile: result.data };
    } catch (error) {
      console.error("GET_PROFILE error:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(parameters, currentUser) {
    const controller = require("../controllers/authController");

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.updateProfile(req, res, next);
      return { profile: result.data, action: "updated" };
    } catch (error) {
      console.error("UPDATE_PROFILE error:", error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(parameters, currentUser) {
    const controller = require("../controllers/authController");

    if (!parameters.current_password) {
      throw new ApiError("Current password is required", 400);
    }

    if (!parameters.new_password) {
      throw new ApiError("New password is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.changePassword(req, res, next);
      return {
        success: result.data?.success || true,
        action: "password_changed",
      };
    } catch (error) {
      console.error("CHANGE_PASSWORD error:", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(parameters, currentUser) {
    const controller = require("../controllers/authController");
    const req = { user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.logout(req, res, next);
      return { success: result.data?.success || true, action: "logged_out" };
    } catch (error) {
      console.error("LOGOUT error:", error);
      throw error;
    }
  }

  // ===== EmailWebhook Module (3 actions) =====

  /**
   * Handle Postmark webhook
   */
  async handlePostmarkWebhook(parameters, currentUser) {
    const controller = require("../controllers/webhookController");

    if (!parameters.payload) {
      throw new ApiError("Webhook payload is required", 400);
    }

    const req = { body: parameters.payload };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.handlePostmarkWebhook(req, res, next);
      return { processed: result.data, action: "processed" };
    } catch (error) {
      console.error("HANDLE_POSTMARK_WEBHOOK error:", error);
      throw error;
    }
  }

  /**
   * Handle SendGrid webhook
   */
  async handleSendgridWebhook(parameters, currentUser) {
    const controller = require("../controllers/webhookController");

    if (!parameters.payload) {
      throw new ApiError("Webhook payload is required", 400);
    }

    const req = { body: parameters.payload };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.handleSendgridWebhook(req, res, next);
      return { processed: result.data, action: "processed" };
    } catch (error) {
      console.error("HANDLE_SENDGRID_WEBHOOK error:", error);
      throw error;
    }
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(parameters, currentUser) {
    const controller = require("../controllers/webhookController");

    if (!parameters.provider) {
      throw new ApiError("Provider is required", 400);
    }

    const req = { body: parameters, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.testWebhook(req, res, next);
      return { test: result.data, action: "tested" };
    } catch (error) {
      console.error("TEST_WEBHOOK error:", error);
      throw error;
    }
  }

  // ===== LeadCapture Module (1 action) =====

  /**
   * Create lead capture form
   */
  async createCaptureForm(parameters, currentUser) {
    const controller = require("../controllers/leadCaptureController");

    if (!parameters.name) {
      throw new ApiError("Form name is required", 400);
    }

    if (
      !parameters.fields ||
      !Array.isArray(parameters.fields) ||
      parameters.fields.length === 0
    ) {
      throw new ApiError("Form fields are required", 400);
    }

    const formData = {
      ...parameters,
      company_id: currentUser.company_id,
      created_by: currentUser.id,
    };

    const req = { body: formData, user: currentUser };
    const res = { json: (data) => data };
    const next = (error) => {
      throw error;
    };

    try {
      const result = await controller.createCaptureForm(req, res, next);
      return { form: result.data, action: "created" };
    } catch (error) {
      console.error("CREATE_CAPTURE_FORM error:", error);
      throw error;
    }
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();

module.exports = chatbotService;
