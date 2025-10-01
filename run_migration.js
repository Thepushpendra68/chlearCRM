/**
 * Script to run the leads table schema migration
 * This adds first_name and last_name columns to the leads table
 */

require('dotenv').config();
const { supabaseAdmin } = require('./backend/src/config/supabase');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Starting leads table schema migration...');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'fix_leads_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL migration loaded');
    console.log('🔧 Executing migration...');

    // Execute the migration
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Result:', data);

    // Test the new schema by checking if columns exist
    console.log('🔍 Verifying new columns...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('leads')
      .select('id, first_name, last_name, name')
      .limit(1);

    if (testError) {
      console.error('❌ Verification failed:', testError);
    } else {
      console.log('✅ Schema verification successful!');
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