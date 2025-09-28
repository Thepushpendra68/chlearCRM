require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function debugTasksLeads() {
  try {
    console.log('🔍 Debugging tasks and leads relationship...');

    // Test 1: Check raw tasks data
    console.log('\n1️⃣ Checking raw tasks data...');
    const { data: rawTasks, error: rawError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, lead_id, company_id')
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073')
      .limit(3);

    if (rawError) {
      console.log('❌ Raw tasks query failed:', rawError.message);
    } else {
      console.log('✅ Raw tasks query successful:', rawTasks?.length || 0, 'tasks found');
      rawTasks?.forEach(task => {
        console.log(`   - Task: ${task.title}, lead_id: ${task.lead_id}`);
      });
    }

    // Test 2: Check leads data
    console.log('\n2️⃣ Checking leads data...');
    const { data: rawLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, name, company_id')
      .eq('company_id', 'be21c126-d3f8-4366-9239-9e650850c073')
      .limit(3);

    if (leadsError) {
      console.log('❌ Leads query failed:', leadsError.message);
    } else {
      console.log('✅ Leads query successful:', rawLeads?.length || 0, 'leads found');
      rawLeads?.forEach(lead => {
        console.log(`   - Lead: ${lead.name}, id: ${lead.id}`);
      });
    }

    // Test 3: Try the join manually
    console.log('\n3️⃣ Testing manual join...');
    if (rawTasks?.length > 0 && rawTasks[0].lead_id) {
      const { data: joinTest, error: joinError } = await supabaseAdmin
        .from('tasks')
        .select(`
          id, title, lead_id,
          leads!tasks_lead_id_fkey(id, name)
        `)
        .eq('id', rawTasks[0].id)
        .single();

      if (joinError) {
        console.log('❌ Join test failed:', joinError.message);
      } else {
        console.log('✅ Join test successful:', {
          task: joinTest.title,
          lead_data: joinTest.leads
        });
      }
    } else {
      console.log('⚠️ No lead_id found in first task, skipping join test');
    }

    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugTasksLeads();