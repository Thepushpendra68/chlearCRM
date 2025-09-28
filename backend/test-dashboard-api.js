const { supabaseAdmin } = require('./src/config/supabase');
const analyticsService = require('./src/services/analyticsService');

async function testDashboardAPI() {
  try {
    console.log('🧪 Testing Dashboard API Functionality...');

    // Get the user that should have the data
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('first_name', 'Pushpendra')
      .eq('last_name', 'Singh')
      .single();

    if (userError || !userProfile) {
      console.error('❌ Could not find Pushpendra Singh user:', userError);
      return;
    }

    console.log('✅ Found user:', {
      id: userProfile.id,
      name: `${userProfile.first_name} ${userProfile.last_name}`,
      role: userProfile.role,
      company_id: userProfile.company_id
    });

    // Check leads for this user's company
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('company_id', userProfile.company_id);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
      return;
    }

    console.log(`📊 Found ${leads.length} leads for this company`);

    // Show lead status breakdown
    const statusCounts = {};
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    console.log('\n📈 Lead Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    // Test the analytics service directly
    console.log('\n🔬 Testing Analytics Service...');

    const currentUser = {
      id: userProfile.id,
      company_id: userProfile.company_id,
      role: userProfile.role,
      first_name: userProfile.first_name,
      last_name: userProfile.last_name
    };

    try {
      const dashboardStats = await analyticsService.getDashboardStats(currentUser);

      console.log('\n✅ Dashboard Stats Result:');
      console.log(JSON.stringify(dashboardStats, null, 2));

      // Test recent leads
      const recentLeads = await analyticsService.getRecentLeads(currentUser, 5);
      console.log(`\n📋 Recent Leads: ${recentLeads.length} found`);

      // Test lead sources
      const leadSources = await analyticsService.getLeadSources(currentUser);
      console.log(`\n📊 Lead Sources: ${leadSources.length} sources found`);

      console.log('\n✅ All dashboard API functions working correctly!');

    } catch (analyticsError) {
      console.error('❌ Analytics service error:', analyticsError);
      console.error('Stack trace:', analyticsError.stack);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testDashboardAPI().then(() => process.exit(0));