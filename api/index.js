// Vercel Serverless Function - Express API
// Note: Vercel automatically injects environment variables, no need for dotenv

// Debug: Log environment variable availability
console.log('🔍 [API] Environment variables check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
  hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasSupabaseJwtSecret: !!process.env.SUPABASE_JWT_SECRET,
  hasGeminiKey: !!process.env.GEMINI_API_KEY,
  nodeEnv: process.env.NODE_ENV
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Import and use routes from backend
try {
  const authRoutes = require('../backend/src/routes/authRoutes');
  const supabaseAuthRoutes = require('../backend/src/routes/supabaseAuthRoutes');
  const userRoutes = require('../backend/src/routes/userRoutes');
  const leadRoutes = require('../backend/src/routes/leadRoutes');
  const dashboardRoutes = require('../backend/src/routes/dashboardRoutes');
  const pipelineRoutes = require('../backend/src/routes/pipelineRoutes');
  const activityRoutes = require('../backend/src/routes/activityRoutes');
  const assignmentRoutes = require('../backend/src/routes/assignmentRoutes');
  const reportRoutes = require('../backend/src/routes/reportRoutes');
  const taskRoutes = require('../backend/src/routes/taskRoutes');
  const importRoutes = require('../backend/src/routes/importRoutes');
  const searchRoutes = require('../backend/src/routes/searchRoutes');
  const chatbotRoutes = require('../backend/src/routes/chatbotRoutes');
  const platformRoutes = require('../backend/src/routes/platformRoutes');
  const picklistRoutes = require('../backend/src/routes/picklistRoutes');
  const apiClientRoutes = require('../backend/src/routes/apiClientRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api/supabase-auth', supabaseAuthRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/pipeline', pipelineRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/api/platform', platformRoutes);
  app.use('/api/picklists', picklistRoutes);
  app.use('/api', apiClientRoutes);
} catch (error) {
  console.error('Failed to load backend routes:', error);

  app.use('/api/*', (req, res) => {
    res.status(500).json({
      error: 'Failed to initialize API routes',
      message: error.message
    });
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

module.exports = app;
