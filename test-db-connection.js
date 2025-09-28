const { supabaseAdmin } = require('./backend/src/config/supabase');

async function test() {
  try {
    console.log('Testing database connection...');

    // Test leads table
    const { data: leadsCount, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (leadsError) {
      console.log('Leads table error:', leadsError.message);
    } else {
      console.log('Total leads in database:', leadsCount);
    }

    // Test companies table
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*');

    if (companiesError) {
      console.log('Companies table error:', companiesError.message);
    } else {
      console.log('Total companies:', companies?.length || 0);
      if (companies?.length > 0) {
        console.log('First company:', companies[0]);
      }
    }

    // Test user_profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.log('User profiles table error:', profilesError.message);
    } else {
      console.log('Total user profiles:', profiles?.length || 0);
      if (profiles?.length > 0) {
        console.log('First profile:', profiles[0]);
      }
    }

  } catch (e) {
    console.log('Connection error:', e.message);
  }
}

test();