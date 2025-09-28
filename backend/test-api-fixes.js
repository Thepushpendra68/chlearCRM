require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function testAPIFixes() {
  try {
    console.log('🧪 Testing API fixes for schema mismatches...');

    // Test 1: Direct leads query (should work now)
    console.log('\n1️⃣ Testing leads table access...');
    const { data: leadsTest, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, company, status')
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073')
      .limit(5);

    if (leadsError) {
      console.log('❌ Leads query failed:', leadsError.message);
    } else {
      console.log('✅ Leads query successful:', leadsTest?.length || 0, 'leads found');
      if (leadsTest?.length > 0) {
        console.log('📋 Sample lead:', {
          name: leadsTest[0].name,
          company: leadsTest[0].company,
          status: leadsTest[0].status
        });
      }
    }

    // Test 2: Tasks query (should work now)
    console.log('\n2️⃣ Testing tasks table access...');
    const { data: tasksTest, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(`
        id, title, status,
        leads(name, email),
        assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name),
        created_user:user_profiles!tasks_created_by_fkey(first_name, last_name)
      `)
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073')
      .limit(5);

    if (tasksError) {
      console.log('❌ Tasks query failed:', tasksError.message);
    } else {
      console.log('✅ Tasks query successful:', tasksTest?.length || 0, 'tasks found');
    }

    // Test 3: Recent leads query for dashboard (should work now)
    console.log('\n3️⃣ Testing dashboard recent leads...');
    const { data: recentLeads, error: recentError } = await supabaseAdmin
      .from('leads')
      .select(`
        id, name, email, company, status, source, created_at, assigned_to,
        user_profiles!assigned_to(first_name, last_name)
      `)
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log('❌ Recent leads query failed:', recentError.message);
    } else {
      console.log('✅ Recent leads query successful:', recentLeads?.length || 0, 'recent leads found');
    }

    // Test 4: User profiles query
    console.log('\n4️⃣ Testing user_profiles table structure...');
    const { data: profilesTest, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, role, company_id')
      .eq('id', '8cc7c99f-c91f-41e7-a80f-36117d9523e8')
      .single();

    if (profilesError) {
      console.log('❌ User profiles query failed:', profilesError.message);
    } else {
      console.log('✅ User profiles query successful:', {
        name: `${profilesTest.first_name} ${profilesTest.last_name}`,
        role: profilesTest.role
      });
    }

    console.log('\n🎉 API fixes testing completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAPIFixes();