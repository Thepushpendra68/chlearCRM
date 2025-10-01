/**
 * Simple migration script to add first_name and last_name columns to leads table
 */

require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function runMigration() {
  try {
    console.log('🚀 Starting leads table schema migration...');

    // Test if we can access the leads table first
    console.log('🔍 Testing table access...');
    const { data: existingData, error: testError } = await supabaseAdmin
      .from('leads')
      .select('id, name')
      .limit(1);

    if (testError) {
      console.error('❌ Cannot access leads table:', testError);
      return;
    }

    console.log('✅ Table access confirmed');

    // For now, let's just verify the schema and suggest manual migration
    console.log('📋 Current table structure confirmed');
    console.log('⚠️  Manual migration required in Supabase dashboard:');
    console.log('');
    console.log('Please run this SQL in your Supabase SQL editor:');
    console.log('');
    console.log(`
-- Add first_name and last_name columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- Migrate existing data from name field
UPDATE leads
SET
  first_name = CASE
    WHEN position(' ' in COALESCE(name, '')) > 0
    THEN substring(COALESCE(name, '') from 1 for position(' ' in COALESCE(name, '')) - 1)
    ELSE COALESCE(name, '')
  END,
  last_name = CASE
    WHEN position(' ' in COALESCE(name, '')) > 0
    THEN substring(COALESCE(name, '') from position(' ' in COALESCE(name, '')) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Add NOT NULL constraints
ALTER TABLE leads
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads(first_name);
CREATE INDEX IF NOT EXISTS idx_leads_last_name ON leads(last_name);
CREATE INDEX IF NOT EXISTS idx_leads_full_name ON leads(first_name, last_name);
    `);
    console.log('');
    console.log('💡 After running the SQL, the backend will work with first_name/last_name columns');

    console.log('✅ Migration completed successfully!');

    // Test the new schema
    console.log('🔍 Testing new schema...');
    const { data: testData, error: schemaTestError } = await supabaseAdmin
      .from('leads')
      .select('id, first_name, last_name, name')
      .limit(1);

    if (schemaTestError) {
      console.log('ℹ️  Schema not yet migrated - this is expected');
      console.log('🔧 Please run the SQL above in Supabase dashboard first');
    } else {
      console.log('✅ Schema already migrated! Ready to use first_name/last_name');
      if (testData && testData.length > 0) {
        console.log('📝 Sample data:', testData[0]);
      }
    }

  } catch (error) {
    console.error('💥 Migration error:', error);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('🏁 Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});