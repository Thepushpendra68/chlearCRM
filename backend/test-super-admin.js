/**
 * Super Admin Platform Testing Script
 *
 * This script tests all super admin platform endpoints to ensure they work correctly.
 * Run after completing Phase 5 implementation.
 *
 * Usage:
 *   node test-super-admin.js
 *
 * Prerequisites:
 *   - Backend server running on http://localhost:5000
 *   - Super admin user created and credentials available
 *   - At least one company and user in database
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

  const email = await prompt('\nEnter super admin email: ');
  const password = await prompt('Enter super admin password: ');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      const userRole = response.data.user?.role;

      recordTest(
        'Super admin login',
        userRole === 'super_admin',
        userRole === 'super_admin' ? 'Role: super_admin' : `Warning: Role is ${userRole}, expected super_admin`
      );

      if (userRole !== 'super_admin') {
        log('\n⚠️  WARNING: User is not a super_admin. Most tests will fail.', 'red');
        const continueTests = await prompt('Continue anyway? (y/n): ');
        if (continueTests.toLowerCase() !== 'y') {
          process.exit(1);
        }
      }
    } else {
      recordTest('Super admin login', false, 'No token received');
      process.exit(1);
    }
  } catch (error) {
    recordTest('Super admin login', false, error.response?.data?.message || error.message);
    process.exit(1);
  }
}

// Test platform stats endpoint
async function testPlatformStats() {
  log('\n📋 Phase 2: Platform Statistics Tests', 'blue');
  log('='.repeat(50), 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/platform/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const stats = response.data.data;
    const hasRequiredFields = stats.total_companies !== undefined &&
                              stats.total_users !== undefined &&
                              stats.total_leads !== undefined;

    recordTest(
      'Get platform statistics',
      response.data.success && hasRequiredFields,
      `Companies: ${stats.total_companies}, Users: ${stats.total_users}, Leads: ${stats.total_leads}`
    );

    return stats;
  } catch (error) {
    recordTest('Get platform statistics', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test companies endpoint
async function testCompanies() {
  log('\n📋 Phase 3: Companies Management Tests', 'blue');
  log('='.repeat(50), 'blue');

  try {
    // Get all companies
    const response = await axios.get(`${BASE_URL}/platform/companies`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 20 }
    });

    const hasCompanies = response.data.data && response.data.data.length > 0;
    recordTest(
      'Get all companies',
      response.data.success,
      `Found ${response.data.data?.length || 0} companies`
    );

    if (hasCompanies) {
      const firstCompany = response.data.data[0];

      // Test search
      const searchResponse = await axios.get(`${BASE_URL}/platform/companies`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { search: firstCompany.company_name.substring(0, 3) }
      });

      recordTest(
        'Search companies',
        searchResponse.data.success,
        `Search for "${firstCompany.company_name.substring(0, 3)}" returned ${searchResponse.data.data?.length || 0} results`
      );

      // Test status filter
      const statusResponse = await axios.get(`${BASE_URL}/platform/companies`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { status: firstCompany.status }
      });

      recordTest(
        'Filter companies by status',
        statusResponse.data.success,
        `Filter by "${firstCompany.status}" returned ${statusResponse.data.data?.length || 0} results`
      );

      return firstCompany.company_id;
    } else {
      skipTest('Search companies', 'No companies found');
      skipTest('Filter companies by status', 'No companies found');
      return null;
    }
  } catch (error) {
    recordTest('Get all companies', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test company details
async function testCompanyDetails(companyId) {
  log('\n📋 Phase 4: Company Details Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!companyId) {
    skipTest('Get company details', 'No company ID available');
    skipTest('Update company status', 'No company ID available');
    return null;
  }

  try {
    const response = await axios.get(`${BASE_URL}/platform/companies/${companyId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const hasRequiredData = response.data.data?.company &&
                           response.data.data?.users !== undefined &&
                           response.data.data?.stats !== undefined;

    recordTest(
      'Get company details',
      response.data.success && hasRequiredData,
      `Users: ${response.data.data?.users?.length || 0}, Stats included: ${!!response.data.data?.stats}`
    );

    // Test status update (only if user confirms)
    const testUpdate = await prompt('\nTest company status update? This will modify data. (y/n): ');

    if (testUpdate.toLowerCase() === 'y') {
      const currentStatus = response.data.data.company.status;
      const newStatus = currentStatus === 'active' ? 'trial' : 'active';

      const updateResponse = await axios.put(
        `${BASE_URL}/platform/companies/${companyId}/status`,
        { status: newStatus, reason: 'Testing super admin functionality' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      recordTest(
        'Update company status',
        updateResponse.data.success,
        `Changed from "${currentStatus}" to "${newStatus}"`
      );

      // Revert the change
      await axios.put(
        `${BASE_URL}/platform/companies/${companyId}/status`,
        { status: currentStatus, reason: 'Reverting test change' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      log(`    Reverted status back to "${currentStatus}"`, 'cyan');
    } else {
      skipTest('Update company status', 'User declined');
    }

    return response.data.data.users?.[0]?.id;
  } catch (error) {
    recordTest('Get company details', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test user search
async function testUserSearch() {
  log('\n📋 Phase 5: User Search Tests', 'blue');
  log('='.repeat(50), 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/platform/users/search`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 20 }
    });

    recordTest(
      'Search all users',
      response.data.success,
      `Found ${response.data.data?.length || 0} users`
    );

    if (response.data.data && response.data.data.length > 0) {
      const firstUser = response.data.data[0];

      // Test role filter
      const roleResponse = await axios.get(`${BASE_URL}/platform/users/search`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { role: firstUser.role, limit: 20 }
      });

      recordTest(
        'Filter users by role',
        roleResponse.data.success,
        `Filter by "${firstUser.role}" returned ${roleResponse.data.data?.length || 0} results`
      );
    } else {
      skipTest('Filter users by role', 'No users found');
    }
  } catch (error) {
    recordTest('Search all users', false, error.response?.data?.message || error.message);
  }
}

// Test audit logs
async function testAuditLogs() {
  log('\n📋 Phase 6: Audit Logs Tests', 'blue');
  log('='.repeat(50), 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/platform/audit-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 50 }
    });

    const hasLogs = response.data.data && response.data.data.length > 0;
    recordTest(
      'Get audit logs',
      response.data.success,
      `Found ${response.data.data?.length || 0} audit logs`
    );

    if (hasLogs) {
      // Test severity filter
      const severityResponse = await axios.get(`${BASE_URL}/platform/audit-logs`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { severity: 'info' }
      });

      recordTest(
        'Filter audit logs by severity',
        severityResponse.data.success,
        `Filter by "info" returned ${severityResponse.data.data?.length || 0} results`
      );

      // Test action filter
      const actionResponse = await axios.get(`${BASE_URL}/platform/audit-logs`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { action: 'view_platform_stats' }
      });

      recordTest(
        'Filter audit logs by action',
        actionResponse.data.success,
        `Filter by "view_platform_stats" returned ${actionResponse.data.data?.length || 0} results`
      );
    } else {
      skipTest('Filter audit logs by severity', 'No audit logs found');
      skipTest('Filter audit logs by action', 'No audit logs found');
    }
  } catch (error) {
    recordTest('Get audit logs', false, error.response?.data?.message || error.message);
  }
}

// Test recent activity
async function testRecentActivity() {
  log('\n📋 Phase 7: Recent Activity Tests', 'blue');
  log('='.repeat(50), 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/platform/activity`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 20 }
    });

    recordTest(
      'Get recent platform activity',
      response.data.success,
      `Found ${response.data.data?.length || 0} recent activities`
    );
  } catch (error) {
    recordTest('Get recent platform activity', false, error.response?.data?.message || error.message);
  }
}

// Test authorization (non-super admin should be blocked)
async function testAuthorization() {
  log('\n📋 Phase 8: Authorization Tests', 'blue');
  log('='.repeat(50), 'blue');

  const testNonSuperAdmin = await prompt('\nTest with a non-super admin user? You\'ll need their credentials. (y/n): ');

  if (testNonSuperAdmin.toLowerCase() !== 'y') {
    skipTest('Non-super admin blocked from platform', 'User declined');
    return;
  }

  const email = await prompt('Enter non-super admin email: ');
  const password = await prompt('Enter non-super admin password: ');

  try {
    // Login as non-super admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });

    if (!loginResponse.data.success) {
      skipTest('Non-super admin blocked from platform', 'Login failed');
      return;
    }

    const nonSuperAdminToken = loginResponse.data.token;

    // Try to access platform endpoint
    try {
      await axios.get(`${BASE_URL}/platform/stats`, {
        headers: { Authorization: `Bearer ${nonSuperAdminToken}` }
      });

      recordTest(
        'Non-super admin blocked from platform',
        false,
        'Non-super admin was able to access platform (SECURITY ISSUE!)'
      );
    } catch (error) {
      const isBlocked = error.response?.status === 403;
      recordTest(
        'Non-super admin blocked from platform',
        isBlocked,
        isBlocked ? 'Correctly returned 403 Forbidden' : `Unexpected error: ${error.message}`
      );
    }
  } catch (error) {
    skipTest('Non-super admin blocked from platform', `Login error: ${error.message}`);
  }
}

// Test impersonation (optional)
async function testImpersonation(userId) {
  log('\n📋 Phase 9: Impersonation Tests (Optional)', 'blue');
  log('='.repeat(50), 'blue');

  if (!userId) {
    skipTest('Start impersonation', 'No user ID available');
    skipTest('End impersonation', 'No user ID available');
    return;
  }

  const testImpersonation = await prompt('\nTest impersonation feature? This will create audit logs. (y/n): ');

  if (testImpersonation.toLowerCase() !== 'y') {
    skipTest('Start impersonation', 'User declined');
    skipTest('End impersonation', 'User declined');
    return;
  }

  try {
    // Test any endpoint with impersonation header
    const response = await axios.get(`${BASE_URL}/leads`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'x-impersonate-user-id': userId
      }
    });

    recordTest(
      'Start impersonation',
      response.data.success,
      'Successfully accessed endpoint as impersonated user'
    );

    // End impersonation
    const endResponse = await axios.post(
      `${BASE_URL}/platform/impersonate/end`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    recordTest(
      'End impersonation',
      endResponse.data.success,
      'Impersonation ended successfully'
    );
  } catch (error) {
    recordTest('Start impersonation', false, error.response?.data?.message || error.message);
  }
}

// Print final report
function printReport() {
  log('\n' + '='.repeat(50), 'blue');
  log('📊 TESTING SUMMARY', 'blue');
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
    log('🎉 All tests passed! Super admin platform is working correctly.\n', 'green');
  } else if (testResults.failed > 0) {
    log('⚠️  Some tests failed. Please review the errors above.\n', 'yellow');
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 SUPER ADMIN PLATFORM TESTING SCRIPT', 'cyan');
  log('='.repeat(50), 'cyan');
  log('This script will test all super admin platform endpoints.\n', 'cyan');

  try {
    await testAuthentication();
    await testPlatformStats();
    const companyId = await testCompanies();
    const userId = await testCompanyDetails(companyId);
    await testUserSearch();
    await testAuditLogs();
    await testRecentActivity();
    await testAuthorization();
    await testImpersonation(userId);

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
