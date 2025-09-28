require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function testTasksAPI() {
  try {
    console.log('🧪 Testing tasks API...');

    // Test 1: Direct tasks query
    console.log('\n1️⃣ Testing tasks table access...');
    const { data: tasksTest, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        leads(name, email),
        assigned_user:user_profiles!tasks_assigned_to_fkey(first_name, last_name),
        created_user:user_profiles!tasks_created_by_fkey(first_name, last_name)
      `)
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073')
      .limit(3);

    if (tasksError) {
      console.log('❌ Tasks query failed:', tasksError.message);
      console.log('❌ Full error:', tasksError);
    } else {
      console.log('✅ Tasks query successful:', tasksTest?.length || 0, 'tasks found');
      if (tasksTest?.length > 0) {
        console.log('📋 Sample task:', {
          title: tasksTest[0].title,
          status: tasksTest[0].status,
          lead_name: tasksTest[0].leads?.name,
          assigned_user: tasksTest[0].assigned_user ?
            `${tasksTest[0].assigned_user.first_name} ${tasksTest[0].assigned_user.last_name}` :
            'Unassigned'
        });
      }
    }

    // Test 2: Check if tasks table exists
    console.log('\n2️⃣ Testing tasks table structure...');
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Tasks table error:', tableError.message);
    } else {
      console.log('✅ Tasks table accessible');
    }

    console.log('\n🎉 Tasks API testing completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testTasksAPI();