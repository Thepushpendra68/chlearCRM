require("dotenv").config();
const express = require("express");

console.log("🚀 [APP] Starting backend application...");
console.log(
  "🚀 [APP] Environment variables loaded:",
  !!process.env.SUPABASE_URL,
);
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Handle uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});

// Handle SIGTERM and SIGINT for graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Legacy database connection (disabled - now using Supabase)
// require('./config/database');

// Import routes
const authRoutes = require("./routes/authRoutes");
const supabaseAuthRoutes = require("./routes/supabaseAuthRoutes");
const userRoutes = require("./routes/userRoutes");
const leadRoutes = require("./routes/leadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const pipelineRoutes = require("./routes/pipelineRoutes");
const activityRoutes = require("./routes/activityRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const taskRoutes = require("./routes/taskRoutes");
const importRoutes = require("./routes/importRoutes");
const searchRoutes = require("./routes/searchRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const platformRoutes = require("./routes/platformRoutes");
const preferencesRoutes = require("./routes/preferencesRoutes");
const picklistRoutes = require("./routes/picklistRoutes");
const leadCaptureRoutes = require("./routes/leadCaptureRoutes");
const apiClientRoutes = require("./routes/apiClientRoutes");
const customFieldRoutes = require("./routes/customFieldRoutes");
const emailRoutes = require("./routes/emailRoutes");
console.log("📦 [APP] Loading account routes...");
const accountRoutes = require("./routes/accountRoutes");
console.log("✅ [APP] Account routes loaded successfully:", !!accountRoutes);
console.log("📦 [APP] Loading contact routes...");
const contactRoutes = require("./routes/contactRoutes");
console.log("✅ [APP] Contact routes loaded successfully:", !!contactRoutes);
console.log("📦 [APP] Loading scoring routes...");
const scoringRoutes = require("./routes/scoringRoutes");
console.log("✅ [APP] Scoring routes loaded successfully:", !!scoringRoutes);
console.log("📦 [APP] Loading voice routes...");
const voiceRoutes = require("./routes/voiceRoutes");
console.log("✅ [APP] Voice routes loaded successfully:", !!voiceRoutes);

// Import middleware
const errorHandler = require("./middleware/errorMiddleware");

// Initialize email sequence worker (starts automatically in production)
require("./workers/emailSequenceWorker");

const app = express();
const PORT = process.env.PORT || 5000;

// Debug middleware to log all requests (placed FIRST)
app.use((req, res, next) => {
  console.log("🌐 [REQUEST DEBUG] Method:", req.method, "URL:", req.url);
  console.log("🌐 [REQUEST DEBUG] Headers received:", !!req.headers);
  console.log(
    "🌐 [REQUEST DEBUG] Authorization header:",
    req.headers.authorization ? "PRESENT" : "MISSING",
  );
  console.log("🌐 [REQUEST DEBUG] Full URL:", req.url);
  next();
});

// Security middleware
app.use(helmet());

// Rate limiting - Disabled for development
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // increased limit
    message: {
      error: "Too many requests from this IP, please try again later.",
    },
  });
  app.use(limiter);
}

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
].filter(Boolean); // Remove undefined values

// Allow all Vercel preview deployments
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow Vercel deployments (*.vercel.app)
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Cache statistics endpoint
app.get("/admin/cache-stats", (req, res) => {
  try {
    const cache = require("./utils/cache");
    const stats = cache.getStats();

    res.status(200).json({
      status: "OK",
      cache: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to get cache stats",
      error: error.message,
    });
  }
});

// Performance metrics endpoint
app.get("/admin/performance", (req, res) => {
  try {
    const cache = require("./utils/cache");

    res.status(200).json({
      status: "OK",
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cache: cache.getStats(),
        environment: process.env.NODE_ENV || "development",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to get performance metrics",
      error: error.message,
    });
  }
});

// Debug endpoint to check headers
app.get("/debug-headers", (req, res) => {
  res.status(200).json({
    headers: req.headers,
    authorization: req.headers.authorization,
    userAgent: req.headers["user-agent"],
  });
});

// API routes
// Note: Impersonation is now handled automatically in the authenticate middleware
app.use("/api/auth", authRoutes); // Legacy auth routes (keep for backward compatibility during migration)
app.use("/api/supabase-auth", supabaseAuthRoutes); // New Supabase auth routes
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/import", importRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/picklists", picklistRoutes);
app.use("/api/api-clients", apiClientRoutes); // API client management (admin only)
app.use("/api/custom-fields", customFieldRoutes); // Custom field definitions management
app.use("/api/v1/capture", leadCaptureRoutes); // Lead capture (public API with API key auth)
app.use("/api/email", emailRoutes); // Email templates, sending, and automation
console.log("🔗 [APP] Registering /api/accounts routes...");
app.use("/api/accounts", accountRoutes); // Account management
console.log("✅ [APP] /api/accounts routes registered");
console.log("🔗 [APP] Registering /api/contacts routes...");
app.use("/api/contacts", contactRoutes); // Contact management
console.log("✅ [APP] /api/contacts routes registered");
console.log("🔗 [APP] Registering /api/scoring routes...");
app.use("/api/scoring", scoringRoutes); // Lead scoring system
console.log("✅ [APP] /api/scoring routes registered");
console.log("🔗 [APP] Registering /api/voice routes...");
app.use("/api/voice", voiceRoutes); // Voice interface (speech-to-text, commands, TTS)
console.log("✅ [APP] /api/voice routes registered");

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
      path: req.originalUrl,
    },
  });
});

// Global error handler
app.use(errorHandler);

// Start server only if not running in serverless mode (e.g., Vercel)
if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
    server.close((err) => {
      if (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
      console.log("✅ Server closed successfully");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.log("⚠️ Forcing shutdown...");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
} else {
  console.log("🚀 Running in serverless mode (Vercel/AWS Lambda)");
}

module.exports = app;
