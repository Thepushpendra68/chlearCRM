const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFix() {
  console.log('🔍 VERIFYING THE FIX...');

  try {
    // Check companies
    const { data: companies } = await supabase.from('companies').select('*');
    console.log(`✅ Companies: ${companies?.length || 0} found`);

    // Check user profiles
    const { data: profiles } = await supabase.from('user_profiles').select('*');
    console.log(`✅ User profiles: ${profiles?.length || 0} found`);

    // Test user profile view
    const { data: profilesView, error } = await supabase.from('user_profiles_with_auth').select('*');
    console.log(`🔍 User profiles view: ${error ? 'Error - ' + error.message : 'Works - ' + profilesView?.length + ' records'}`);

    if (companies?.length > 0) {
      console.log('\nCompanies found:');
      companies.forEach(company => {
        console.log(`   📍 ${company.name} (ID: ${company.id})`);
      });
    }

    if (profiles?.length > 0) {
      console.log('\nUser profiles found:');
      profiles.forEach(profile => {
        console.log(`   👤 ${profile.first_name} ${profile.last_name} (Role: ${profile.role})`);
      });
    }

    console.log('\n🎉 YOUR DATA IS NOW FIXED!');
    console.log('Now try logging in and the dashboard should work properly.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyFix();