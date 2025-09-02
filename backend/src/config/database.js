const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Enhanced database configuration with better connection management
const enhancedConfig = {
  ...config,
  pool: {
    min: 1,
    max: 5,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 300000, // 5 minutes
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    propagateCreateError: false
  },
  acquireConnectionTimeout: 30000,
  debug: process.env.NODE_ENV === 'development'
};

const db = knex(enhancedConfig);

// Test database connection with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await db.raw('SELECT 1');
      console.log('✅ Database connected successfully');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ Database connection failed after all retries');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

testConnection();

// Handle database connection errors
db.on('error', (err) => {
  console.error('Database connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection lost, attempting to reconnect...');
  }
});

module.exports = db;