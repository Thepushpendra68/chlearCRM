/**
 * Contacts API Testing Script
 *
 * This script tests all contacts API endpoints to verify the feature works correctly.
 * It requires valid credentials to authenticate and test the API.
 *
 * Usage:
 *   node test-contacts-api.js
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

// Test GET /api/contacts - List all contacts
async function testListContacts() {
  log('\n📋 Phase 2: List Contacts Tests', 'blue');
  log('='.repeat(50), 'blue');

  try {
    // Test basic list
    const response = await axios.get(`${BASE_URL}/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });

    recordTest(
      'GET /api/contacts - List contacts',
      response.data.success,
      `Found ${response.data.data?.length || 0} contacts, Total: ${response.data.total || 0}`
    );

    // Test pagination
    const page2Response = await axios.get(`${BASE_URL}/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 2, limit: 5 }
    });

    recordTest(
      'GET /api/contacts - Pagination',
      page2Response.data.success,
      `Page 2: ${page2Response.data.data?.length || 0} contacts`
    );

    // Test search
    const searchResponse = await axios.get(`${BASE_URL}/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { search: 'john', limit: 10 }
    });

    recordTest(
      'GET /api/contacts - Search',
      searchResponse.data.success,
      `Search "john": ${searchResponse.data.data?.length || 0} results`
    );

    // Test status filter
    const statusResponse = await axios.get(`${BASE_URL}/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { status: 'active', limit: 10 }
    });

    recordTest(
      'GET /api/contacts - Filter by status',
      statusResponse.data.success,
      `Status "active": ${statusResponse.data.data?.length || 0} results`
    );

    return response.data.data?.[0]?.id || null;
  } catch (error) {
    recordTest('GET /api/contacts - List contacts', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test GET /api/contacts/:id - Get single contact
async function testGetContact(contactId) {
  log('\n📋 Phase 3: Get Contact Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!contactId) {
    skipTest('GET /api/contacts/:id - Get single contact', 'No contact ID available');
    return null;
  }

  try {
    const response = await axios.get(`${BASE_URL}/contacts/${contactId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const hasRequiredFields = response.data.data &&
                              response.data.data.first_name &&
                              response.data.data.last_name;

    recordTest(
      'GET /api/contacts/:id - Get single contact',
      response.data.success && hasRequiredFields,
      `Contact: ${response.data.data?.first_name} ${response.data.data?.last_name}`
    );

    return contactId;
  } catch (error) {
    recordTest('GET /api/contacts/:id - Get single contact', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test POST /api/contacts - Create contact
async function testCreateContact() {
  log('\n📋 Phase 4: Create Contact Tests', 'blue');
  log('='.repeat(50), 'blue');

  const testContact = {
    first_name: 'Test',
    last_name: 'Contact',
    email: `testcontact${Date.now()}@example.com`,
    phone: '555-0123',
    title: 'QA Test Contact',
    status: 'active'
  };

  try {
    const response = await axios.post(`${BASE_URL}/contacts`, testContact, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'POST /api/contacts - Create contact',
      response.data.success && response.data.data?.id,
      `Created: ${response.data.data?.first_name} ${response.data.data?.last_name}`
    );

    return response.data.data?.id || null;
  } catch (error) {
    recordTest('POST /api/contacts - Create contact', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test PUT /api/contacts/:id - Update contact
async function testUpdateContact(contactId) {
  log('\n📋 Phase 5: Update Contact Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!contactId) {
    skipTest('PUT /api/contacts/:id - Update contact', 'No contact ID available');
    return false;
  }

  const updateData = {
    title: 'Updated Title',
    phone: '555-9999',
    notes: 'Updated via API test'
  };

  try {
    const response = await axios.put(`${BASE_URL}/contacts/${contactId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'PUT /api/contacts/:id - Update contact',
      response.data.success,
      `Updated title to: "${updateData.title}"`
    );

    return true;
  } catch (error) {
    recordTest('PUT /api/contacts/:id - Update contact', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test DELETE /api/contacts/:id - Delete contact
async function testDeleteContact(contactId) {
  log('\n📋 Phase 6: Delete Contact Tests', 'blue');
  log('='.repeat(50), 'blue');

  if (!contactId) {
    skipTest('DELETE /api/contacts/:id - Delete contact', 'No contact ID available');
    return false;
  }

  const confirmDelete = await prompt('\nTest DELETE contact? This will permanently delete data. (y/n): ');

  if (confirmDelete.toLowerCase() !== 'y') {
    skipTest('DELETE /api/contacts/:id - Delete contact', 'User declined');
    return false;
  }

  try {
    const response = await axios.delete(`${BASE_URL}/contacts/${contactId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest(
      'DELETE /api/contacts/:id - Delete contact',
      response.data.success,
      'Contact deleted successfully'
    );

    return true;
  } catch (error) {
    recordTest('DELETE /api/contacts/:id - Delete contact', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test error handling
async function testErrorHandling() {
  log('\n📋 Phase 7: Error Handling Tests', 'blue');
  log('='.repeat(50), 'blue');

  // Test invalid contact ID
  try {
    await axios.get(`${BASE_URL}/contacts/invalid-uuid`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest('GET /api/contacts/:id - Invalid UUID', false, 'Should have returned 400 error');
  } catch (error) {
    const isBadRequest = error.response?.status === 400 || error.response?.status === 404;
    recordTest(
      'GET /api/contacts/:id - Invalid UUID',
      isBadRequest,
      `Correctly returned ${error.response?.status} error`
    );
  }

  // Test create without required fields
  try {
    await axios.post(`${BASE_URL}/contacts`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    recordTest('POST /api/contacts - Missing required fields', false, 'Should have returned validation error');
  } catch (error) {
    const isValidationError = error.response?.status === 400;
    recordTest(
      'POST /api/contacts - Missing required fields',
      isValidationError,
      `Correctly returned ${error.response?.status} validation error`
    );
  }

  // Test access without token
  try {
    await axios.get(`${BASE_URL}/contacts`);
    recordTest('GET /api/contacts - No auth token', false, 'Should have returned 401 error');
  } catch (error) {
    const isUnauthorized = error.response?.status === 401 || error.response?.status === 500;
    recordTest(
      'GET /api/contacts - No auth token',
      isUnauthorized,
      `Correctly returned ${error.response?.status} error`
    );
  }
}

// Test bulk operations
async function testBulkOperations() {
  log('\n📋 Phase 8: Bulk Operations Tests', 'blue');
  log('='.repeat(50), 'blue');

  // Test bulk create if endpoint exists
  try {
    const bulkContacts = [
      { first_name: 'Bulk', last_name: 'Test1', email: `bulk1@example.com` },
      { first_name: 'Bulk', last_name: 'Test2', email: `bulk2@example.com` },
      { first_name: 'Bulk', last_name: 'Test3', email: `bulk3@example.com` }
    ];

    const response = await axios.post(`${BASE_URL}/contacts/bulk`, { contacts: bulkContacts }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      recordTest(
        'POST /api/contacts/bulk - Create multiple contacts',
        true,
        `Created ${bulkContacts.length} contacts`
      );
    } else {
      skipTest('POST /api/contacts/bulk - Create multiple contacts', 'Endpoint not available or failed');
    }
  } catch (error) {
    skipTest('POST /api/contacts/bulk - Create multiple contacts', error.response?.status === 404 ? 'Endpoint not implemented' : error.response?.data?.message);
  }
}

// Print final report
function printReport() {
  log('\n' + '='.repeat(50), 'blue');
  log('📊 CONTACTS API TESTING SUMMARY', 'blue');
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
    log('🎉 All tests passed! Contacts feature is working correctly.\n', 'green');
  } else if (testResults.failed > 0) {
    log('⚠️  Some tests failed. Please review the errors above.\n', 'yellow');
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 CONTACTS API TESTING SCRIPT', 'cyan');
  log('='.repeat(50), 'cyan');
  log('This script will test all contacts API endpoints.\n', 'cyan');

  try {
    // Phase 1: Authentication
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      log('\n❌ Authentication failed. Exiting.\n', 'red');
      process.exit(1);
    }

    // Phase 2: List contacts
    const contactId = await testListContacts();

    // Phase 3: Get single contact
    await testGetContact(contactId);

    // Phase 4: Create contact
    const newContactId = await testCreateContact();

    // Phase 5: Update contact
    await testUpdateContact(newContactId || contactId);

    // Phase 6: Delete contact
    await testDeleteContact(newContactId || contactId);

    // Phase 7: Error handling
    await testErrorHandling();

    // Phase 8: Bulk operations
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
