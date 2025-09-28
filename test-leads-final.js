require('dotenv').config({ path: './backend/.env' });
const { supabaseAdmin } = require('./backend/src/config/supabase');

async function testLeadsAPI() {
  try {
    console.log('🧪 Testing final leads API fix...');

    // Test leads query that was failing
    console.log('\n1️⃣ Testing leads table with user_profiles join...');
    const { data: leadsTest, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select(`
        id, name, email, company, status, source, deal_value, expected_close_date, notes,
        priority, created_at, updated_at, assigned_at,
        assigned_to, created_by, pipeline_stage_id,
        user_profiles!assigned_to(id, first_name, last_name)
      `)
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073')
      .limit(3);

    if (leadsError) {
      console.log('❌ Leads query failed:', leadsError.message);
    } else {
      console.log('✅ Leads query successful:', leadsTest?.length || 0, 'leads found');
      if (leadsTest?.length > 0) {
        console.log('📋 Sample lead:', {
          name: leadsTest[0].name,
          company: leadsTest[0].company,
          status: leadsTest[0].status,
          assigned_user: leadsTest[0].user_profiles ?
            `${leadsTest[0].user_profiles.first_name} ${leadsTest[0].user_profiles.last_name}` :
            'Unassigned'
        });
      }
    }

    console.log('\n🎉 Leads API testing completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testLeadsAPI();