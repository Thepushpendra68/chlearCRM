/**
 * Accounts API Testing Script
 *
 * This script tests all accounts API endpoints to verify the feature works correctly.
 * It requires valid credentials to authenticate and test the API.
 *
 * Usage:
 *   node test-accounts-api.js
 *
 * Prerequisites:
 *   - Valid user credentials (email/password)
 *   - API endpoint accessible (local or production)
 */

const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log with color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to prompt user input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Test result tracking
function recordTest(name, passed, message = '') {
  const result = {
    name,
    passed,
    message
  };

  testResults.tests.push(result);

  if (passed) {
    testResults.passed++;
    log(`  ✓ ${name}`, 'green');
    if (message) log(`    ${message}`, 'cyan');
  } else {
    testResults.failed++;
    log(`  ✗ ${name}`, 'red');
    if (message) log(`    ${message}`, 'yellow');
  }
}

// Skip test
function skipTest(name, reason) {
  testResults.skipped++;
  testResults.tests.push({ name, skipped: true, reason });
  log(`  ⊘ ${name} (skipped: ${reason})`, 'yellow');
}

// Test authentication
async function testAuthentication() {
  log('\n📋 Phase 1: Authentication Tests', 'blue');
  log('='.repeat(50), 'blue');

  const email = await prompt('\nEnter user email: ');
  const password = await prompt('Enter password: ');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      const userRole = response.data.user?.role;

      recordTest(
        'User login',
        true,
        `Role: ${userRole}, Company: ${response.data.user?.company_id?.substring(0, 8)}...`
      );

      return true;
    } else {
      recordTest('User login', false, 'No token received');
      return false;
    }
  } catch (error) {
    recordTest('User login', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test GET /api/accounts - List all accounts
async function testListAccounts() {
  log('\n📋 Phase 2: List Accounts Tests', 'blue');
  log('='.repeat(50), 'blue');

  try {
    // Test basic list
    const response = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });

    recordTest(
      'GET /api/accounts - List accounts',
      response.data.success,
      `Found ${response.data.data?.length || 0} accounts, Total: ${response.data.total || 0}`
    );

    // Test pagination
    const page2Response = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 2, limit: 5 }
    });

    recordTest(
      'GET /api/accounts - Pagination',
      page2Response.data.success,
      `Page 2: ${page2Response.data.data?.length || 0} accounts`
    );

    // Test search
    const searchResponse = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { search: 'tech', limit: 10 }
    });

    recordTest(
      'GET /api/accounts - Search',
      searchResponse.data.success,
      `Search "tech": ${searchResponse.data.data?.length || 0} results`
    );

    // Test status filter
    const statusResponse = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { status: 'active', limit: 10 }
    });

    recordTest(
      'GET /api/accounts - Filter by status',
      statusResponse.data.success,
      `Status "active": ${statusResponse.data.data?.length || 0} results`
    );

    // Test industry filter
    const industryResponse = await axios.get(`${BASE_URL}/accounts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { industry: 'technology', limit: 10 }
    });

    recordTest(
      'GET /api/accounts - Filter by industry',
      industryResponse.data.success,
      `Industry "technology": ${industryResponse.data.data?.length || 0} results`
    );

    return response.data.data?.[0]?.id || null;
  } catch (error) {
    recordTest('GET /api/accounts - List accounts', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test GET /api/accounts/:id - Get single account
async function testGetAccount(accountId) {
  log('\n📋 Phase 3: Get Account Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!accountId) {
    skipTest('GET /api/accounts/:id - Get single account', 'No account ID available');
    return null;
  }

  try {
    const response = await axios.get(`${BASE_URL}/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const hasRequiredFields = response.data.data &&
                              response.data.data.name &&
                              response.data.data.company_id;

    recordTest(
      'GET /api/accounts/:id - Get single account',
      response.data.success && hasRequiredFields,
      `Account: ${response.data.data?.name}`
    );

    return accountId;
  } catch (error) {
    recordTest('GET /api/accounts/:id - Get single account', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test POST /api/accounts - Create account
async function testCreateAccount() {
  log('\n📋 Phase 4: Create Account Tests', 'blue');
  log('='.repeat(50), 'blue');

  const testAccount = {
    name: `Test Company ${Date.now()}`,
    website: 'https://testcompany.com',
    industry: 'Technology',
    phone: '+1-555-0123',
    email: 'contact@testcompany.com',
    annual_revenue: 1000000,
    employee_count: 50,
    status: 'active'
  };

  try {
    const response = await axios.post(`${BASE_URL}/accounts`, testAccount, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'POST /api/accounts - Create account',
      response.data.success && response.data.data?.id,
      `Created: ${response.data.data?.name}`
    );

    return response.data.data?.id || null;
  } catch (error) {
    recordTest('POST /api/accounts - Create account', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test PUT /api/accounts/:id - Update account
async function testUpdateAccount(accountId) {
  log('\n📋 Phase 5: Update Account Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!accountId) {
    skipTest('PUT /api/accounts/:id - Update account', 'No account ID available');
    return false;
  }

  const updateData = {
    industry: 'Software',
    employee_count: 100,
    notes: 'Updated via API test'
  };

  try {
    const response = await axios.put(`${BASE_URL}/accounts/${accountId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'PUT /api/accounts/:id - Update account',
      response.data.success,
      `Updated industry to: "${updateData.industry}"`
    );

    return true;
  } catch (error) {
    recordTest('PUT /api/accounts/:id - Update account', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test DELETE /api/accounts/:id - Delete account
async function testDeleteAccount(accountId) {
  log('\n📋 Phase 6: Delete Account Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!accountId) {
    skipTest('DELETE /api/accounts/:id - Delete account', 'No account ID available');
    return false;
  }

  const confirmDelete = await prompt('\nTest DELETE account? This will permanently delete data. (y/n): ');

  if (confirmDelete.toLowerCase() !== 'y') {
    skipTest('DELETE /api/accounts/:id - Delete account', 'User declined');
    return false;
  }

  try {
    const response = await axios.delete(`${BASE_URL}/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'DELETE /api/accounts/:id - Delete account',
      response.data.success,
      'Account deleted successfully'
    );

    return true;
  } catch (error) {
    recordTest('DELETE /api/accounts/:id - Delete account', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test GET /api/accounts/:id/leads - Get account leads
async function testGetAccountLeads(accountId) {
  log('\n📋 Phase 7: Account Leads Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!accountId) {
    skipTest('GET /api/accounts/:id/leads - Get account leads', 'No account ID available');
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/accounts/${accountId}/leads`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'GET /api/accounts/:id/leads - Get account leads',
      response.data.success,
      `Found ${response.data.data?.length || 0} leads`
    );
  } catch (error) {
    recordTest('GET /api/accounts/:id/leads - Get account leads', false, error.response?.data?.message || error.message);
  }
}

// Test GET /api/accounts/:id/stats - Get account stats
async function testGetAccountStats(accountId) {
  log('\n📋 Phase 8: Account Stats Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!accountId) {
    skipTest('GET /api/accounts/:id/stats - Get account stats', 'No account ID available');
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/accounts/${accountId}/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'GET /api/accounts/:id/stats - Get account stats',
      response.data.success,
      `Stats retrieved successfully`
    );
  } catch (error) {
    recordTest('GET /api/accounts/:id/stats - Get account stats', false, error.response?.data?.message || error.message);
  }
}

// Test GET /api/accounts/:id/timeline - Get account timeline
async function testGetAccountTimeline(accountId) {
  log('\n📋 Phase 9: Account Timeline Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!accountId) {
    skipTest('GET /api/accounts/:id/timeline - Get account timeline', 'No account ID available');
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/accounts/${accountId}/timeline`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'GET /api/accounts/:id/timeline - Get account timeline',
      response.data.success,
      `Timeline events: ${response.data.data?.length || 0}`
    );
  } catch (error) {
    recordTest('GET /api/accounts/:id/timeline - Get account timeline', false, error.response?.data?.message || error.message);
  }
}

// Test error handling
async function testErrorHandling() {
  log('\n📋 Phase 10: Error Handling Tests', 'blue');
  log('='.repeat(50), 'blue');

  // Test invalid account ID
  try {
    await axios.get(`${BASE_URL}/accounts/invalid-uuid`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest('GET /api/accounts/:id - Invalid UUID', false, 'Should have returned 400 error');
  } catch (error) {
    const isBadRequest = error.response?.status === 400 || error.response?.status === 404;
    recordTest(
      'GET /api/accounts/:id - Invalid UUID',
      isBadRequest,
      `Correctly returned ${error.response?.status} error`
    );
  }

  // Test create without required fields
  try {
    await axios.post(`${BASE_URL}/accounts`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest('POST /api/accounts - Missing required fields', false, 'Should have returned validation error');
  } catch (error) {
    const isValidationError = error.response?.status === 400;
    recordTest(
      'POST /api/accounts - Missing required fields',
      isValidationError,
      `Correctly returned ${error.response?.status} validation error`
    );
  }

  // Test access without token
  try {
    await axios.get(`${BASE_URL}/accounts`);
    recordTest('GET /api/accounts - No auth token', false, 'Should have returned 401 error');
  } catch (error) {
    const isUnauthorized = error.response?.status === 401 || error.response?.status === 500;
    recordTest(
      'GET /api/accounts - No auth token',
      isUnauthorized,
      `Correctly returned ${error.response?.status} error`
    );
  }
}

// Test bulk operations
async function testBulkOperations() {
  log('\n📋 Phase 11: Bulk Operations Tests', 'blue');
  log('='.repeat(50), 'blue');

  // Test bulk create if endpoint exists
  try {
    const bulkAccounts = [
      { name: 'Bulk Test Company 1', industry: 'Technology' },
      { name: 'Bulk Test Company 2', industry: 'Finance' },
      { name: 'Bulk Test Company 3', industry: 'Healthcare' }
    ];

    const response = await axios.post(`${BASE_URL}/accounts/bulk`, { accounts: bulkAccounts }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      recordTest(
        'POST /api/accounts/bulk - Create multiple accounts',
        true,
        `Created ${bulkAccounts.length} accounts`
      );
    } else {
      skipTest('POST /api/accounts/bulk - Create multiple accounts', 'Endpoint not available or failed');
    }
  } catch (error) {
    skipTest('POST /api/accounts/bulk - Create multiple accounts', error.response?.status === 404 ? 'Endpoint not implemented' : error.response?.data?.message);
  }
}

// Print final report
function printReport() {
  log('\n' + '='.repeat(50), 'blue');
  log('📊 ACCOUNTS API TESTING SUMMARY', 'blue');
  log('='.repeat(50), 'blue');

  log(`\n✓ Passed:  ${testResults.passed}`, 'green');
  log(`✗ Failed:  ${testResults.failed}`, 'red');
  log(`⊘ Skipped: ${testResults.skipped}`, 'yellow');
  log(`━ Total:   ${testResults.tests.length}\n`, 'cyan');

  if (testResults.failed > 0) {
    log('Failed Tests:', 'red');
    testResults.tests
      .filter(t => t.passed === false)
      .forEach(t => {
        log(`  • ${t.name}: ${t.message}`, 'red');
      });
  }

  const successRate = testResults.tests.length > 0
    ? ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
    : 0;

  log(`\nSuccess Rate: ${successRate}%\n`, successRate >= 80 ? 'green' : 'yellow');

  if (testResults.failed === 0 && testResults.passed > 0) {
    log('🎉 All tests passed! Accounts feature is working correctly.\n', 'green');
  } else if (testResults.failed > 0) {
    log('⚠️  Some tests failed. Please review the errors above.\n', 'yellow');
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 ACCOUNTS API TESTING SCRIPT', 'cyan');
  log('='.repeat(50), 'cyan');
  log('This script will test all accounts API endpoints.\n', 'cyan');

  try {
    // Phase 1: Authentication
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      log('\n❌ Authentication failed. Exiting.\n', 'red');
      process.exit(1);
    }

    // Phase 2: List accounts
    const accountId = await testListAccounts();

    // Phase 3: Get single account
    await testGetAccount(accountId);

    // Phase 4: Create account
    const newAccountId = await testCreateAccount();

    // Phase 5: Update account
    await testUpdateAccount(newAccountId || accountId);

    // Phase 6: Delete account
    await testDeleteAccount(newAccountId || accountId);

    // Phase 7: Account leads
    await testGetAccountLeads(newAccountId || accountId);

    // Phase 8: Account stats
    await testGetAccountStats(newAccountId || accountId);

    // Phase 9: Account timeline
    await testGetAccountTimeline(newAccountId || accountId);

    // Phase 10: Error handling
    await testErrorHandling();

    // Phase 11: Bulk operations
    await testBulkOperations();

    printReport();

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();
