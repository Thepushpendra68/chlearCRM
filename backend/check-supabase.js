const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  try {
    console.log('\n🔍 Testing connection and checking existing tables...');

    // Test connection with a simple query that should work
    const { data: authData, error: authError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    if (authError) {
      console.log('❌ Cannot access auth.users:', authError.message);
    } else {
      console.log('✅ Connection successful! Auth system is working.');
    }

    // Check what tables exist by trying to access them
    const tablesToCheck = [
      'companies',
      'user_profiles',
      'pipeline_stages',
      'leads',
      'activities',
      'tasks',
      'import_history',
      'role_permissions'
    ];

    console.log('\n📋 Checking existing tables:');
    let existingTables = [];
    let missingTables = [];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
          missingTables.push(table);
        } else {
          console.log(`✅ ${table}: exists and accessible`);
          existingTables.push(table);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
        missingTables.push(table);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Existing tables: ${existingTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);

    if (missingTables.length > 0) {
      console.log('\n📝 Migration needed for:', missingTables.join(', '));
      console.log('\n🚀 You can run the migration by:');
      console.log('1. Go to https://supabase.com/dashboard/project/qlivxpsvlymxfnamxvhz/sql');
      console.log('2. Copy the contents of supabase_migration_final.sql');
      console.log('3. Paste and run in the SQL Editor');
    } else {
      console.log('\n🎉 All tables exist! Migration appears complete.');
    }

    // If some tables exist, let's check if we can create a simple test
    if (existingTables.includes('companies')) {
      console.log('\n🔍 Testing table access...');
      const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('*')
        .limit(5);

      if (!compError && companies) {
        console.log(`✅ Found ${companies.length} companies in database`);
      }
    }

  } catch (error) {
    console.error('💥 Database check failed:', error);
  }
}

checkDatabase().catch(console.error);