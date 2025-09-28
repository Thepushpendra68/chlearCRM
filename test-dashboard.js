// Test script to validate dashboard functionality
const { supabaseAdmin } = require('./backend/src/config/supabase');

async function testDashboard() {
  try {
    console.log('🧪 Testing Dashboard Functionality...');

    // First, let's check if we have any companies and users
    const { data: companies, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .limit(5);

    if (companyError) {
      console.error('❌ Company query error:', companyError);
      return;
    }

    console.log(`📊 Found ${companies.length} companies`);

    if (companies.length === 0) {
      console.log('⚠️  No companies found. Creating test company...');

      const { data: newCompany, error: createError } = await supabaseAdmin
        .from('companies')
        .insert([
          {
            name: 'Test Company',
            domain: 'test.com',
            subscription_plan: 'basic',
            subscription_status: 'active'
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create test company:', createError);
        return;
      }

      console.log('✅ Created test company:', newCompany.name);
      companies.push(newCompany);
    }

    const testCompany = companies[0];
    console.log(`🏢 Using company: ${testCompany.name} (ID: ${testCompany.id})`);

    // Check for users in this company
    const { data: users, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('company_id', testCompany.id)
      .limit(5);

    if (userError) {
      console.error('❌ User query error:', userError);
      return;
    }

    console.log(`👥 Found ${users.length} users in company`);

    // Check for leads
    const { data: leads, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('company_id', testCompany.id)
      .limit(10);

    if (leadError) {
      console.error('❌ Lead query error:', leadError);
      return;
    }

    console.log(`📋 Found ${leads.length} leads in company`);

    if (leads.length === 0) {
      console.log('⚠️  No leads found. Creating test leads...');

      const testLeads = [
        {
          company_id: testCompany.id,
          name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          phone: '+1-555-0123',
          status: 'new',
          source: 'website',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
        },
        {
          company_id: testCompany.id,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          company: 'Tech Solutions',
          phone: '+1-555-0456',
          status: 'contacted',
          source: 'referral',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
        },
        {
          company_id: testCompany.id,
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          company: 'Digital Inc',
          phone: '+1-555-0789',
          status: 'converted',
          source: 'social_media',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        },
        {
          company_id: testCompany.id,
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          company: 'Business Co',
          phone: '+1-555-0321',
          status: 'qualified',
          source: 'email_campaign',
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
        },
        {
          company_id: testCompany.id,
          name: 'David Brown',
          email: 'david.brown@example.com',
          company: 'Enterprise Ltd',
          phone: '+1-555-0654',
          status: 'converted',
          source: 'website',
          created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() // 50 days ago
        }
      ];

      const { data: newLeads, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert(testLeads)
        .select();

      if (insertError) {
        console.error('❌ Failed to create test leads:', insertError);
        return;
      }

      console.log(`✅ Created ${newLeads.length} test leads`);
    }

    // Now test dashboard stats calculation
    console.log('\n📊 Testing Dashboard Stats Calculation...');

    // Calculate current period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calculate previous period (30-60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Total leads
    const { count: totalLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', testCompany.id);

    // New leads (last 30 days)
    const { count: newLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', testCompany.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Previous period new leads (30-60 days ago)
    const { count: previousNewLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', testCompany.id)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Converted leads
    const { count: convertedLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', testCompany.id)
      .eq('status', 'converted');

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : '0.0';

    // Calculate change percentages
    const newLeadsChange = previousNewLeads > 0
      ? ((newLeads - previousNewLeads) / previousNewLeads * 100).toFixed(1)
      : newLeads > 0 ? '100.0' : '0.0';

    console.log('\n📈 Dashboard Metrics:');
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`New Leads (last 30 days): ${newLeads}`);
    console.log(`Previous Period New Leads: ${previousNewLeads}`);
    console.log(`New Leads Change: ${newLeadsChange >= 0 ? '+' : ''}${newLeadsChange}%`);
    console.log(`Converted Leads: ${convertedLeads}`);
    console.log(`Conversion Rate: ${conversionRate}%`);

    console.log('\n✅ Dashboard test completed successfully!');

  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
  }
}

// Run the test
testDashboard().then(() => process.exit(0));