const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    console.log('🚀 Starting Supabase migration execution...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase_migration_final.sql');
    let sql = fs.readFileSync(migrationPath, 'utf8');

    // Remove BEGIN/COMMIT as we'll execute each statement separately
    sql = sql.replace(/BEGIN;/g, '').replace(/COMMIT;/g, '');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    let executed = 0;
    let errors = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      try {
        // Skip comments and empty statements
        if (statement.trim().startsWith('--') || statement.trim() === ';') {
          continue;
        }

        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errors++;
        } else {
          executed++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`💥 Exception in statement ${i + 1}:`, err.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully executed: ${executed}`);
    console.log(`❌ Errors: ${errors}`);

    if (errors === 0) {
      console.log('\n🎉 Migration completed successfully!');

      // Test the migration by checking if tables exist
      console.log('\n🔍 Verifying migration...');
      await verifyMigration();
    } else {
      console.log('\n⚠️ Migration completed with errors. Please check the logs above.');
      console.log('You may need to run some statements manually in Supabase SQL Editor.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

async function verifyMigration() {
  const tablesToCheck = [
    'companies',
    'user_profiles',
    'pipeline_stages',
    'leads',
    'activities',
    'tasks',
    'import_history'
  ];

  console.log('🔍 Checking if tables were created...');

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }
}

// Alternative: Direct SQL execution using a custom function
async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql function for migration...');

  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS TEXT AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'OK';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN SQLERRM;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  // We need to execute this manually first
  console.log('📋 Please execute this SQL in your Supabase SQL Editor first:');
  console.log('========================================');
  console.log(createFunctionSql);
  console.log('========================================');
  console.log('\nAfter executing the above, run this script again.');
}

// Check if we have the exec_sql function
async function checkExecSqlFunction() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
    return !error;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if exec_sql function exists...');

  const hasExecSql = await checkExecSqlFunction();

  if (!hasExecSql) {
    await createExecSqlFunction();
    return;
  }

  await executeMigration();
}

main().catch(console.error);