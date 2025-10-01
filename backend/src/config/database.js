// Supabase Migration: Knex/PostgreSQL connection completely removed
// Using Supabase as the ONLY database - no Knex for application code
// Knex is only kept for database migrations via CLI commands

let db = null;

// Knex is now completely disabled for application use
// Only available through migration CLI commands
const initializeKnex = () => {
  console.warn('⚠️  Knex is disabled for application code. Use Supabase instead.');
  return null;
};

// Database connection completely disabled - using Supabase only
// db = initializeKnex(); // Completely removed for Supabase migration

// Test database connection - now uses Supabase
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Test Supabase connection instead of Knex
      const { supabaseAdmin } = require('./supabase');
      const { data, error } = await supabaseAdmin.from('companies').select('count').limit(1);

      if (error) {
        throw error;
      }

      console.log('✅ Supabase database connected successfully');
      return;
    } catch (error) {
      console.error(`❌ Supabase connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ Supabase connection failed after all retries');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Database connection completely disabled - using Supabase only
console.log('🎉 Migration Complete: Using Supabase as ONLY database');
console.log('📦 Knex removed from application code, kept only for migrations');

// Handle database connection errors - now Supabase only
console.log('✅ Database (Supabase) configuration loaded - Knex completely removed from app');

// Export null for backward compatibility, but services should use Supabase directly
module.exports = db;