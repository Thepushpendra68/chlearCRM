const { supabaseAdmin } = require('./backend/src/config/supabase');

async function createTestLeads() {
  try {
    console.log('🔍 Creating test leads for dashboard...');

    // Get the first company
    const { data: companies, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .limit(1);

    if (companyError || companies.length === 0) {
      console.error('❌ No companies found:', companyError);
      return;
    }

    const company = companies[0];
    console.log(`🏢 Using company: ${company.name} (ID: ${company.id})`);

    // Check existing leads
    const { data: existingLeads, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('company_id', company.id);

    if (leadError) {
      console.error('❌ Error checking leads:', leadError);
      return;
    }

    console.log(`📋 Found ${existingLeads.length} existing leads`);

    if (existingLeads.length < 10) {
      console.log('⚠️  Creating sample leads for testing...');

      const sampleLeads = [
        {
          company_id: company.id,
          name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          phone: '+1-555-0123',
          status: 'new',
          source: 'website',
          notes: 'Interested in our premium package',
          deal_value: 5000,
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          company_id: company.id,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          company: 'Tech Solutions',
          phone: '+1-555-0456',
          status: 'contacted',
          source: 'referral',
          notes: 'Warm lead from existing client',
          deal_value: 7500,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          company_id: company.id,
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          company: 'Digital Inc',
          phone: '+1-555-0789',
          status: 'converted',
          source: 'social_media',
          notes: 'Closed deal for enterprise package',
          deal_value: 15000,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          company_id: company.id,
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          company: 'Business Co',
          phone: '+1-555-0321',
          status: 'qualified',
          source: 'email_campaign',
          notes: 'High value prospect',
          deal_value: 12000,
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          company_id: company.id,
          name: 'David Brown',
          email: 'david.brown@example.com',
          company: 'Enterprise Ltd',
          phone: '+1-555-0654',
          status: 'converted',
          source: 'website',
          notes: 'Successful conversion from demo',
          deal_value: 20000,
          created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          company_id: company.id,
          name: 'Lisa Davis',
          email: 'lisa.davis@enterprise.com',
          company: 'Davis Enterprise',
          phone: '+1-555-1234',
          status: 'new',
          source: 'trade_show',
          notes: 'Met at industry conference',
          deal_value: 8000,
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          company_id: company.id,
          name: 'Tom Wilson',
          email: 'tom.wilson@consulting.biz',
          company: 'Wilson Consulting',
          phone: '+1-555-5678',
          status: 'contacted',
          source: 'cold_call',
          notes: 'Follow up scheduled for next week',
          deal_value: 6000,
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          company_id: company.id,
          name: 'Emma Taylor',
          email: 'emma.taylor@startup.io',
          company: 'Taylor Startup',
          phone: '+1-555-9012',
          status: 'qualified',
          source: 'referral',
          notes: 'Strong interest in our services',
          deal_value: 9000,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const { data: newLeads, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert(sampleLeads)
        .select();

      if (insertError) {
        console.error('❌ Failed to create leads:', insertError);
        return;
      }

      console.log(`✅ Created ${newLeads.length} sample leads`);
    }

    // Now check the lead breakdown
    const { data: allLeads, error: allLeadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('company_id', company.id);

    if (allLeadsError) {
      console.error('❌ Error getting all leads:', allLeadsError);
      return;
    }

    console.log('\n📊 Lead Status Breakdown:');
    const statusCounts = {};
    allLeads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    // Calculate dashboard metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalLeads = allLeads.length;
    const newLeads = allLeads.filter(lead => new Date(lead.created_at) >= thirtyDaysAgo).length;
    const convertedLeads = allLeads.filter(lead => lead.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : '0.0';

    console.log('\n📈 Expected Dashboard Metrics:');
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`New Leads (last 30 days): ${newLeads}`);
    console.log(`Converted Leads: ${convertedLeads}`);
    console.log(`Conversion Rate: ${conversionRate}%`);

    console.log('\n✅ Test data created! The dashboard should now show real metrics.');

  } catch (error) {
    console.error('❌ Failed to create test leads:', error);
  }
}

createTestLeads().then(() => process.exit(0));