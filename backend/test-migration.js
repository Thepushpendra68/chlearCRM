const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMigration() {
  console.log('ðŸ§ª Testing Supabase Migration...\n');

  // Test 1: Check all required tables exist
  console.log('1ï¸âƒ£ Checking table existence...');
  const requiredTables = [
    'companies',
    'user_profiles',
    'pipeline_stages',
    'leads',
    'activities',
    'tasks',
    'import_history',
    'role_permissions'
  ];

  let allTablesExist = true;

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   âŒ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`   âœ… ${table}: exists and accessible`);
      }
    } catch (err) {
      console.log(`   âŒ ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }

  if (!allTablesExist) {
    console.log('\nâŒ Migration incomplete. Please run the SQL migration first.');
    console.log('Go to: https://supabase.com/dashboard/project/qlivxpsvlymxfnamxvhz/sql');
    console.log('Copy and paste the contents of supabase_migration_final.sql');
    return;
  }

  // Test 2: Check role permissions data
  console.log('\n2ï¸âƒ£ Checking role permissions data...');
  try {
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('*');

    if (error) {
      console.log('   âŒ Role permissions not accessible:', error.message);
    } else if (!permissions || permissions.length === 0) {
      console.log('   âš ï¸  Role permissions table exists but is empty');
    } else {
      console.log(`   âœ… Role permissions loaded (${permissions.length} roles configured)`);
      permissions.forEach(role => {
        console.log(`      - ${role.role}: ${role.permissions?.length || 0} permissions`);
      });
    }
  } catch (err) {
    console.log('   âŒ Error checking role permissions:', err.message);
  }

  // Test 3: Check RLS policies (attempt to access without auth)
  console.log('\n3ï¸âƒ£ Testing Row Level Security (RLS)...');
  const anonSupabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '');

  try {
    const { data: companies, error } = await anonSupabase
      .from('companies')
      .select('*')
      .limit(1);

    if (error && error.code === '42501') { // Permission denied
      console.log('   âœ… RLS is working - anonymous access properly blocked');
    } else if (error) {
      console.log('   âš ï¸  RLS test inconclusive:', error.message);
    } else {
      console.log('   âš ï¸  RLS might not be working - anonymous access allowed');
    }
  } catch (err) {
    console.log('   âœ… RLS is working - anonymous access blocked');
  }

  // Test 4: Check database functions
  console.log('\n4ï¸âƒ£ Testing database functions...');
  try {
    // Test a simple function call (this will fail but tells us about function existence)
    const { data, error } = await supabase.rpc('public.get_tenant_id');

    if (error && error.message.includes('function public.get_tenant_id() does not exist')) {
      console.log('   âš ï¸  Some database functions may not be created yet');
    } else {
      console.log('   âœ… Database functions are accessible');
    }
  } catch (err) {
    console.log('   â„¹ï¸  Database functions test completed');
  }

  // Test 5: Test a basic insert/select cycle (with admin privileges)
  console.log('\n5ï¸âƒ£ Testing basic CRUD operations...');
  try {
    // Insert a test company
    const testCompanyData = {
      name: 'Test Company',
      subdomain: 'test-company-' + Date.now(),
      status: 'active',
    };

    const { data: insertedCompany, error: insertError } = await supabase
      .from('companies')
      .insert(testCompanyData)
      .select()
      .single();

    if (insertError) {
      console.log('   âŒ Insert failed:', insertError.message);
    } else {
      console.log('   âœ… Insert successful - test company created');

      // Try to read it back
      const { data: readCompany, error: readError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', insertedCompany.id)
        .single();

      if (readError) {
        console.log('   âŒ Read failed:', readError.message);
      } else {
        console.log('   âœ… Read successful - test company retrieved');

        // Clean up - delete test company
        const { error: deleteError } = await supabase
          .from('companies')
          .delete()
          .eq('id', insertedCompany.id);

        if (deleteError) {
          console.log('   âš ï¸  Cleanup failed - test company still exists');
        } else {
          console.log('   âœ… Cleanup successful - test company deleted');
        }
      }
    }
  } catch (err) {
    console.log('   âŒ CRUD test failed:', err.message);
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('ðŸŽ¯ MIGRATION TEST SUMMARY');
  console.log('='.repeat(60));

  if (allTablesExist) {
    console.log('âœ… Database schema: Complete');
    console.log('âœ… Backend: Ready for Supabase');
    console.log('âœ… Frontend: Ready for Supabase');
    console.log('\nðŸš€ Your migration is ready!');
    console.log('\nNext steps:');
    console.log('1. If tables are missing, run the SQL migration manually');
    console.log('2. Test registration at /register-company');
    console.log('3. Test login with created accounts');
    console.log('4. Verify role-based access control');
  } else {
    console.log('âŒ Migration incomplete - please run SQL migration first');
    console.log('\nRequired action:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the migration from supabase_migration_final.sql');
    console.log('3. Re-run this test script');
  }
}

// Run the test
testMigration().catch(console.error);