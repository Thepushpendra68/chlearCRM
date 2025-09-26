const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment Check:');
console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in backend/.env');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySqlMigration() {
  try {
    console.log('🚀 Starting Supabase migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase_migration_final.sql');
    console.log(`📄 Reading migration from: ${migrationPath}`);

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📝 Migration file size: ${sql.length} characters`);

    // Extract individual statements (everything between semicolons)
    const statements = sql
      .split(/;\s*(?=\n|$)/) // Split on semicolon followed by whitespace and newline/end
      .map(stmt => stmt.trim())
      .filter(stmt =>
        stmt.length > 0 &&
        !stmt.startsWith('--') &&
        stmt !== 'BEGIN' &&
        stmt !== 'COMMIT'
      );

    console.log(`🔧 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();

      if (!statement) continue;

      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`);

      try {
        // Use the direct SQL execution via rpc
        const { data, error } = await supabase.rpc('query', {
          query: statement
        });

        if (error) {
          console.error(`❌ Error: ${error.message}`);
          errors.push({ statement: i + 1, error: error.message, sql: statement });
          errorCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
        }

      } catch (err) {
        console.error(`💥 Exception: ${err.message}`);
        errors.push({ statement: i + 1, error: err.message, sql: statement });
        errorCount++;
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. Statement ${err.statement}:`);
        console.log(`   Error: ${err.error}`);
        console.log(`   SQL: ${err.sql.substring(0, 100)}...`);
      });
    }

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');

      // Test basic functionality
      await testMigration();
    } else {
      console.log('\n⚠️  Migration completed with errors.');
      console.log('Some statements may need to be executed manually in Supabase SQL Editor.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

async function testMigration() {
  console.log('\n🔍 Testing migration...');

  const tablesToTest = [
    'companies',
    'user_profiles',
    'leads',
    'pipeline_stages',
    'activities'
  ];

  for (const table of tablesToTest) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' is accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }

  // Test auth functionality
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log(`❌ Auth test: ${error.message}`);
    } else {
      console.log(`✅ Auth is working (${users?.length || 0} users found)`);
    }
  } catch (err) {
    console.log(`❌ Auth test: ${err.message}`);
  }
}

// Execute the migration
applySqlMigration().catch(console.error);