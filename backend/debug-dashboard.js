const { supabaseAdmin } = require('./src/config/supabase');

async function debugDashboard() {
  try {
    console.log('🔍 Debugging Dashboard Data...');

    // Check companies
    const { data: companies, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .limit(5);

    if (companyError) {
      console.error('❌ Company query error:', companyError);
      return;
    }

    console.log(`\n🏢 Found ${companies.length} companies:`);
    companies.forEach(company => {
      console.log(`  - ${company.name} (ID: ${company.id})`);
    });

    if (companies.length === 0) {
      console.log('\n⚠️  No companies found. Let\'s create one...');

      const { data: newCompany, error: createError } = await supabaseAdmin
        .from('companies')
        .insert([{
          name: 'Test Company',
          domain: 'test.com',
          subscription_plan: 'basic',
          subscription_status: 'active'
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create company:', createError);
        return;
      }

      console.log('✅ Created test company:', newCompany);
      companies.push(newCompany);
    }

    const company = companies[0];

    // Check leads for this company
    const { data: leads, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('company_id', company.id);

    if (leadError) {
      console.error('❌ Lead query error:', leadError);
      return;
    }

    console.log(`\n📋 Found ${leads.length} leads for company "${company.name}"`);

    if (leads.length === 0) {
      console.log('\n⚠️  No leads found. Creating sample leads...');

      const sampleLeads = [
        {
          company_id: company.id,
          name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Acme Corp',
          phone: '+1-555-0123',
          status: 'new',
          source: 'website',
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
          created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
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
      leads.push(...newLeads);
    }

    // Show lead breakdown
    console.log('\n📊 Lead Breakdown:');
    const statusCounts = {};
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    // Test the actual dashboard API call
    console.log('\n🧪 Testing Dashboard Stats Calculation...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: totalLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id);

    const { count: newLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: convertedLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('status', 'converted');

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : '0.0';

    console.log('\n📈 Expected Dashboard Metrics:');
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`New Leads (last 30 days): ${newLeads}`);
    console.log(`Converted Leads: ${convertedLeads}`);
    console.log(`Conversion Rate: ${conversionRate}%`);

    console.log('\n✅ Debug completed! Data should now be available in the dashboard.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugDashboard().then(() => process.exit(0));