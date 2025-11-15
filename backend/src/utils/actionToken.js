const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ApiError = require("./ApiError");

const ACTION_TOKEN_TTL_SECONDS = Number(
  process.env.CHATBOT_ACTION_TTL_SECONDS || 300,
);

const MAX_PARAMETER_SIZE = Number(
  process.env.CHATBOT_ACTION_PARAMETER_LIMIT || 4096,
);

const MAX_USED_TOKENS_STORE = Number(
  process.env.CHATBOT_ACTION_MAX_USED_TOKENS || 1000,
);

const CSRF_TOKEN_TTL_SECONDS = Number(
  process.env.CHATBOT_CSRF_TTL_SECONDS || 3600,
);

// In-memory store for preventing replay attacks
// In production, use Redis or database
const usedTokenStore = new Set();
const csrfTokenStore = new Map();

// Get secrets with validation
const getSecret = () => {
  const secret = process.env.CHATBOT_ACTION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "CHATBOT_ACTION_SECRET or JWT_SECRET must be configured to use chatbot confirmations",
    );
  }
  if (secret.length < 32) {
    console.warn(
      "[ACTION-TOKEN] Secret should be at least 32 characters for security",
    );
  }
  return secret;
};

// Generate CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Validate CSRF token
const validateCSRFToken = (csrfToken) => {
  if (!csrfToken) {
    throw new ApiError("CSRF token is missing", 403);
  }

  const tokenData = csrfTokenStore.get(csrfToken);
  if (!tokenData) {
    throw new ApiError("Invalid CSRF token", 403);
  }

  // Check if CSRF token has expired
  if (Date.now() > tokenData.expiresAt) {
    csrfTokenStore.delete(csrfToken);
    throw new ApiError("CSRF token has expired", 403);
  }

  return true;
};

const assertParameterSize = (parameters) => {
  if (!parameters) {
    return;
  }

  const serialized = JSON.stringify(parameters);
  if (serialized.length > MAX_PARAMETER_SIZE) {
    throw new ApiError(
      "Confirmation payload is too large. Please refine your request.",
      400,
    );
  }
};

// Clean up old used tokens to prevent memory leaks
const cleanupUsedTokens = () => {
  if (usedTokenStore.size > MAX_USED_TOKENS_STORE) {
    const tokensToDelete = Array.from(usedTokenStore).slice(0, MAX_USED_TOKENS_STORE / 2);
    tokensToDelete.forEach((token) => usedTokenStore.delete(token));
    console.log("[ACTION-TOKEN] Cleaned up old used tokens");
  }
};

// Clean up expired CSRF tokens
const cleanupCSRFTokens = () => {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, data] of csrfTokenStore.entries()) {
    if (now > data.expiresAt) {
      csrfTokenStore.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[ACTION-TOKEN] Cleaned up ${cleaned} expired CSRF tokens`);
  }
};

// Create pending action token with CSRF protection
const createPendingActionToken = ({ userId, action, parameters, csrfToken }) => {
  assertParameterSize(parameters);

  // Validate CSRF token if provided
  if (csrfToken) {
    try {
      validateCSRFToken(csrfToken);
    } catch (error) {
      throw new ApiError("Invalid CSRF token", 403);
    }
  }

  // Generate a unique token ID for replay protection
  const tokenId = crypto.randomUUID();

  const expiresAt = new Date(
    Date.now() + ACTION_TOKEN_TTL_SECONDS * 1000,
  ).toISOString();

  // Create JWT with additional security claims
  const token = jwt.sign(
    {
      sub: userId,
      action,
      parameters,
      type: "chatbot_action",
      jti: tokenId, // JWT ID for replay protection
      iat: Math.floor(Date.now() / 1000), // Issued at
      csrf: csrfToken ? crypto.createHash("sha256").update(csrfToken).digest("hex") : null, // CSRF hash
    },
    getSecret(),
    {
      expiresIn: ACTION_TOKEN_TTL_SECONDS,
      issuer: "sakha-chatbot",
      audience: "sakha-actions",
    },
  );

  console.log(`[ACTION-TOKEN] Created action token for user ${userId}, action: ${action}, expires: ${expiresAt}`);

  return { token, expiresAt, tokenId };
};

const verifyPendingActionToken = (token) => {
  try {
    // Enhanced JWT verification with additional security checks
    const payload = jwt.verify(token, getSecret(), {
      issuer: "sakha-chatbot",
      audience: "sakha-actions",
    });

    // Verify token type
    if (payload.type !== "chatbot_action") {
      console.warn("[ACTION-TOKEN] Invalid token type:", payload.type);
      throw new ApiError("Invalid confirmation token", 400);
    }

    // Check if token has been used (replay attack protection)
    if (usedTokenStore.has(token)) {
      console.warn(`[ACTION-TOKEN] Replay attack detected for token ${payload.jti}`);
      throw new ApiError("This confirmation has already been used", 400);
    }

    // Mark token as used
    usedTokenStore.add(token);
    cleanupUsedTokens();

    // Validate required claims
    if (!payload.jti) {
      console.warn("[ACTION-TOKEN] Token missing JTI claim");
      throw new ApiError("Invalid token structure", 400);
    }

    if (!payload.sub || !payload.action) {
      console.warn("[ACTION-TOKEN] Token missing required claims");
      throw new ApiError("Invalid token payload", 400);
    }

    // Log successful verification
    console.log(
      `[ACTION-TOKEN] Token verified successfully for user ${payload.sub}, action: ${payload.action}`,
    );

    return payload;
  } catch (error) {
    // Provide specific error messages based on error type
    if (error.name === "TokenExpiredError") {
      throw new ApiError("Confirmation token has expired", 400);
    } else if (error.name === "JsonWebTokenError") {
      console.warn("[ACTION-TOKEN] JWT verification failed:", error.message);
      throw new ApiError("Confirmation token is invalid", 400);
    } else if (error.name === "NotBeforeError") {
      throw new ApiError("Confirmation token is not yet valid", 400);
    } else {
      throw error;
    }
  }
};

// Create a CSRF token for a user session
const createCSRFToken = (userId) => {
  const csrfToken = generateCSRFToken();
  const expiresAt = Date.now() + CSRF_TOKEN_TTL_SECONDS * 1000;

  csrfTokenStore.set(csrfToken, {
    userId,
    createdAt: Date.now(),
    expiresAt,
  });

  console.log(`[ACTION-TOKEN] Created CSRF token for user ${userId}`);

  return csrfToken;
};

// Verify CSRF token for a specific user
const verifyCSRFToken = (csrfToken, userId) => {
  try {
    validateCSRFToken(csrfToken);

    const tokenData = csrfTokenStore.get(csrfToken);
    if (tokenData.userId !== userId) {
      console.warn(
        `[ACTION-TOKEN] CSRF token user mismatch: ${tokenData.userId} vs ${userId}`,
      );
      throw new ApiError("CSRF token does not belong to this user", 403);
    }

    return true;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Invalid CSRF token", 403);
  }
};

module.exports = {
  ACTION_TOKEN_TTL_SECONDS,
  createPendingActionToken,
  verifyPendingActionToken,
  createCSRFToken,
  verifyCSRFToken,
  generateCSRFToken,
  validateCSRFToken,
};
