require('dotenv').config();
const leadService = require('./src/services/leadService');

console.log('🔍 Testing Lead Service\n');

// Mock user (you'll need to replace with actual user data from your DB)
const mockUser = {
  id: 'test-user-id', // Replace with actual user ID
  role: 'company_admin',
  company_id: 'test-company-id' // Replace with actual company ID
};

async function testLeadService() {
  try {
    console.log('Testing getLeads with status filter: qualified\n');

    const filters = {
      status: 'qualified',
      source: '',
      assigned_to: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    };

    const result = await leadService.getLeads(mockUser, 1, 50, filters);

    console.log('✅ Results:');
    console.log('- Total leads found:', result.totalItems);
    console.log('- Leads on this page:', result.leads.length);
    console.log('- Total pages:', result.totalPages);
    console.log('');

    if (result.leads.length > 0) {
      console.log('📊 Sample lead:');
      console.log(JSON.stringify(result.leads[0], null, 2));
    } else {
      console.log('⚠️  No qualified leads found!');
      console.log('');
      console.log('Possible reasons:');
      console.log('1. The mock user ID/company ID is wrong');
      console.log('2. There are no leads with status="qualified"');
      console.log('3. The user doesn\'t have permission to see those leads');
      console.log('');
      console.log('💡 To fix:');
      console.log('1. Check your database for actual user/company IDs');
      console.log('2. Update mockUser in this script with real IDs');
      console.log('3. Make sure there are leads with status="qualified" in the database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLeadService();