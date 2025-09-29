require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

console.log('🔍 Database Debug Script\n');
console.log('═══════════════════════════════════════════════\n');

async function debugDatabase() {
  try {
    // 1. Check companies
    console.log('1️⃣ Checking companies...');
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .limit(5);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError.message);
    } else {
      console.log(`✅ Found ${companies.length} companies:`);
      companies.forEach(c => console.log(`   - ${c.name} (${c.id})`));
    }
    console.log('');

    // 2. Check users
    console.log('2️⃣ Checking user_profiles...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, role, company_id')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(u => console.log(`   - ${u.first_name} ${u.last_name} (${u.role}) - Company: ${u.company_id}`));
    }
    console.log('');

    // 3. Check leads
    console.log('3️⃣ Checking leads...');
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, status, company_id')
      .limit(10);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError.message);
    } else {
      console.log(`✅ Found ${leads.length} leads:`);

      const statusCount = {};
      leads.forEach(l => {
        statusCount[l.status] = (statusCount[l.status] || 0) + 1;
      });

      console.log('   Status breakdown:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });

      console.log('\n   Sample leads:');
      leads.slice(0, 3).forEach(l => {
        console.log(`   - ${l.name} (${l.email}) - ${l.status} - Company: ${l.company_id}`);
      });
    }
    console.log('');

    // 4. Check qualified leads specifically
    console.log('4️⃣ Checking QUALIFIED leads specifically...');
    const { data: qualifiedLeads, error: qualifiedError } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, status, company_id')
      .eq('status', 'qualified');

    if (qualifiedError) {
      console.error('❌ Error fetching qualified leads:', qualifiedError.message);
    } else {
      console.log(`✅ Found ${qualifiedLeads.length} qualified leads:`);
      qualifiedLeads.forEach(l => {
        console.log(`   - ${l.name} (${l.email}) - Company: ${l.company_id}`);
      });
    }
    console.log('');

    // 5. Provide test user info
    if (users && users.length > 0 && companies && companies.length > 0) {
      console.log('═══════════════════════════════════════════════');
      console.log('📝 USE THIS INFO FOR TESTING:\n');
      console.log('Test User:');
      console.log(`  id: "${users[0].id}"`);
      console.log(`  role: "${users[0].role}"`);
      console.log(`  company_id: "${users[0].company_id}"`);
      console.log('');
      console.log('Update test-lead-service.js with these values!');
      console.log('═══════════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
  }
}

debugDatabase();