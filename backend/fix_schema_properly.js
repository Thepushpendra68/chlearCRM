/**
 * Properly fix the Supabase schema by adding first_name and last_name columns
 * and migrating existing data
 */

require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function fixSchemaCorrectly() {
  try {
    console.log('🚀 Fixing Supabase schema properly...');

    // First, let's see what columns exist
    console.log('🔍 Checking current schema...');
    const { data: existingLeads, error: checkError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking schema:', checkError);
      return;
    }

    console.log('📋 Current columns:', existingLeads?.[0] ? Object.keys(existingLeads[0]) : 'No data');

    // Let's try using a stored procedure approach
    console.log('🔧 Attempting to add columns via stored procedure...');

    // First create a function to execute DDL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION add_name_columns()
      RETURNS void AS $$
      BEGIN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'leads' AND column_name = 'first_name') THEN
          ALTER TABLE leads ADD COLUMN first_name VARCHAR(50);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'leads' AND column_name = 'last_name') THEN
          ALTER TABLE leads ADD COLUMN last_name VARCHAR(50);
        END IF;

        -- Migrate existing data from name to first_name/last_name
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

        -- Set NOT NULL constraints
        ALTER TABLE leads ALTER COLUMN first_name SET NOT NULL;
        ALTER TABLE leads ALTER COLUMN last_name SET NOT NULL;

        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads(first_name);
        CREATE INDEX IF NOT EXISTS idx_leads_last_name ON leads(last_name);
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: createFunctionError } = await supabaseAdmin.rpc('exec', {
      sql: createFunctionSQL
    });

    if (createFunctionError) {
      console.log('ℹ️  Could not create function via RPC, trying direct execution...');

      // Alternative approach: try direct table modification
      console.log('📝 Attempting direct column addition...');

      // Try a simpler approach - just check if we can modify the table directly
      const { error: directError } = await supabaseAdmin
        .from('leads')
        .update({ temp_col: 'test' })
        .eq('id', 'non-existent-id'); // This won't update anything but tests permissions

      console.log('⚠️  Direct table modification test result:', directError ? 'Not allowed' : 'Allowed');

      // Since we can't modify schema directly, let's provide the exact SQL to run manually
      console.log('\n🔧 MANUAL SCHEMA UPDATE REQUIRED');
      console.log('Please run this SQL in your Supabase SQL Editor:\n');

      console.log(`-- Add first_name and last_name columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- Migrate existing data
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

-- Set constraints and indexes
ALTER TABLE leads
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads(first_name);
CREATE INDEX IF NOT EXISTS idx_leads_last_name ON leads(last_name);`);

      console.log('\n🎯 After running the SQL above, restart the backend to use the new schema!');
      return;
    }

    // If we got here, try to execute the function
    const { error: executeError } = await supabaseAdmin.rpc('add_name_columns');

    if (executeError) {
      console.error('❌ Error executing schema update function:', executeError);
      return;
    }

    console.log('✅ Schema updated successfully!');

    // Test the new schema
    const { data: testData, error: testError } = await supabaseAdmin
      .from('leads')
      .select('id, first_name, last_name, name')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing new schema:', testError);
    } else {
      console.log('✅ New schema verified!');
      if (testData?.[0]) {
        console.log('📝 Sample data:', testData[0]);
      }
    }

  } catch (error) {
    console.error('💥 Schema fix error:', error);
  }
}

// Run the schema fix
fixSchemaCorrectly().then(() => {
  console.log('🏁 Schema fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});